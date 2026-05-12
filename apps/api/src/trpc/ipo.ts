import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import {
  IPOEntity,
  IPOPurchaseEntity,
  TransactionEntity,
  CreatorEntity,
  UserEntity,
  ZeedlyService,
} from "../db/index.js";
import { getOffchainWalletSummary } from "../services/offchain-wallet.js";
import { getSolanaWallet } from "../services/solana.js";

const CLAIMABLE_PURCHASE_STATUSES = new Set(["locked", "claimable", "confirmed"]);

export const ipoRouter = router({
  /**
   * List upcoming, live, and completed creator offerings.
   */
  list: publicProcedure.query(async () => {
    const [active, upcoming, closed] = await Promise.all([
      IPOEntity.query.byStatus({ status: "active" }).go(),
      IPOEntity.query.byStatus({ status: "upcoming" }).go(),
      IPOEntity.query.byStatus({ status: "closed" }).go(),
    ]);
    const ipos = [...active.data, ...upcoming.data, ...closed.data];

    if (ipos.length === 0) return [];

    const creatorIds = [...new Set(ipos.map((i) => i.creatorId))];
    const creators = await Promise.all(
      creatorIds.map((id) => CreatorEntity.query.byCreatorId({ creatorId: id }).go()),
    );
    const creatorMap = new Map(creators.flatMap((r) => r.data.map((c) => [c.creatorId, c])));

    return ipos
      .map((ipo) => ({ ...ipo, creator: creatorMap.get(ipo.creatorId) ?? null }))
      .sort((a, b) => {
        const rank: Record<string, number> = { active: 0, upcoming: 1, closed: 2 };
        const aRank = a.status ? rank[a.status] : 3;
        const bRank = b.status ? rank[b.status] : 3;
        return aRank - bRank || a.startsAt - b.startsAt;
      });
  }),

  /**
   * Get IPOs for a specific creator (used on creator detail page).
   */
  getByCreator: publicProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ input }) => {
      const result = await IPOEntity.query.byCreator({ creatorId: input.creatorId }).go();
      return result.data;
    }),

  /**
   * Participate in an active offering using the user's off-chain USDT balance.
   * Tokens are allocated after the offering completes and KYC/claim is handled.
   */
  purchase: protectedProcedure
    .input(
      z.object({
        ipoId: z.string(),
        quantity: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { nanoid } = await import("nanoid");

      const ipoResult = await IPOEntity.query.byIpoId({ ipoId: input.ipoId }).go();
      const ipo = ipoResult.data[0];
      if (!ipo) throw new TRPCError({ code: "NOT_FOUND", message: "IPO not found" });
      if (ipo.status !== "active")
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "IPO is not active" });

      const sold = ipo.sold ?? 0;
      const raisedUsd = ipo.raisedUsd ?? 0;
      const raiseTargetUsd = ipo.raiseTargetUsd || ipo.totalSupply * ipo.pricePerToken;
      const maxInvestmentPerAccountUsd = ipo.maxInvestmentPerAccountUsd || raiseTargetUsd;
      const remainingRaiseUsd = Math.max(0, raiseTargetUsd - raisedUsd);
      const remaining = Math.min(
        ipo.totalSupply - sold,
        Math.floor(remainingRaiseUsd / ipo.pricePerToken),
      );

      if (remaining < 1 || remainingRaiseUsd <= 0) {
        const now = Date.now();
        await IPOEntity.patch({ ipoId: input.ipoId })
          .set({ status: "closed", completedAt: now, tokenMintedAt: now, tokenDispersedAt: now })
          .go();
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Offering is already fully funded" });
      }

      if (input.quantity > remaining)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Only ${remaining.toLocaleString()} tokens remain before this offering completes`,
        });

      const usdAmount = input.quantity * ipo.pricePerToken;
      if (usdAmount > remainingRaiseUsd) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Only ${remainingRaiseUsd.toFixed(2)} USDT remains before this offering completes`,
        });
      }

      const purchases = await IPOPurchaseEntity.query.byUser({ userId: ctx.userId }).go();
      const userInvestedUsd = purchases.data
        .filter(
          (purchase) =>
            purchase.ipoId === input.ipoId &&
            purchase.status !== "failed" &&
            purchase.status !== "refunded",
        )
        .reduce((sum, purchase) => sum + purchase.usdAmount, 0);
      const remainingAccountCapUsd = maxInvestmentPerAccountUsd - userInvestedUsd;
      if (remainingAccountCapUsd < ipo.pricePerToken || usdAmount > remainingAccountCapUsd) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Max investment for this offering is ${maxInvestmentPerAccountUsd.toFixed(2)} USDT per account`,
        });
      }

      const wallet = await getOffchainWalletSummary(ctx.userId);
      if (wallet.availableUsdtBalance < usdAmount) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Insufficient available USDT balance. Available: ${wallet.availableUsdtBalance.toFixed(2)} USDT`,
        });
      }

      const purchaseId = nanoid();
      const txId = nanoid();
      const newRaisedUsd = raisedUsd + usdAmount;
      const newSold = sold + input.quantity;
      const offeringComplete = newRaisedUsd >= raiseTargetUsd;
      const now = Date.now();

      await ZeedlyService.transaction
        .write(({ ipo: ipoTxn, ipoPurchase: purchaseTxn, transaction: transactionTxn }) => [
          purchaseTxn.create({
            purchaseId,
            ipoId: input.ipoId,
            userId: ctx.userId,
            quantity: input.quantity,
            usdAmount,
            asset: "USDT",
            transactionId: txId,
            status: "locked",
          }).commit(),
          transactionTxn.create({
            txId,
            userId: ctx.userId,
            type: "ipo_purchase",
            amount: -usdAmount,
            asset: "USDT",
            referenceId: purchaseId,
            status: "pending",
          }).commit(),
          (offeringComplete
            ? ipoTxn.patch({ ipoId: input.ipoId })
                .set({
                  sold: newSold,
                  raisedUsd: newRaisedUsd,
                  status: "closed",
                  completedAt: now,
                  tokenMintedAt: now,
                })
            : ipoTxn.patch({ ipoId: input.ipoId })
                .set({
                  sold: newSold,
                  raisedUsd: newRaisedUsd,
                })
          )
            .where((attr, { eq }) =>
              `${eq(attr.status, "active")} AND ${eq(attr.sold, sold)} AND ${eq(attr.raisedUsd, raisedUsd)}`,
            )
            .commit(),
        ])
        .go();

      return {
        purchaseId,
        txId,
        usdAmount,
        asset: "USDT" as const,
        status: "locked" as const,
        offeringComplete,
      };
    }),

  /**
   * Claim creator tokens after an offering is filled. This releases the
   * internal USDT debit and records the claim handoff to the user's wallet.
   */
  claim: protectedProcedure
    .input(z.object({ purchaseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { nanoid } = await import("nanoid");

      const purchaseResult = await IPOPurchaseEntity.query
        .byPurchaseId({ purchaseId: input.purchaseId })
        .go();
      const purchase = purchaseResult.data[0];
      if (!purchase || purchase.userId !== ctx.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Allocation not found" });
      }

      if (purchase.status === "claimed") {
        return {
          purchaseId: purchase.purchaseId,
          status: "claimed" as const,
          txSig: purchase.txSig ?? null,
        };
      }

      if (!CLAIMABLE_PURCHASE_STATUSES.has(purchase.status ?? "")) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Allocation is not claimable" });
      }

      const ipoResult = await IPOEntity.query.byIpoId({ ipoId: purchase.ipoId }).go();
      const ipo = ipoResult.data[0];
      if (!ipo || ipo.status !== "closed") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Offering is not filled yet" });
      }

      const userResult = await UserEntity.query.byUserId({ userId: ctx.userId }).go();
      let user = userResult.data[0];
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.kycStatus !== "verified") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Complete KYC before claiming creator tokens",
        });
      }

      let walletAddress = user.solanaPubkey ?? null;
      if (!walletAddress && user.openfortUserId) {
        walletAddress = await getSolanaWallet(user.openfortUserId);
        if (walletAddress) {
          await UserEntity.patch({ userId: ctx.userId }).set({ solanaPubkey: walletAddress }).go();
          user = { ...user, solanaPubkey: walletAddress };
        }
      }

      if (!walletAddress) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No on-chain wallet address is available for this account",
        });
      }

      const now = Date.now();
      const txSig = `claim_${nanoid()}`;
      const transactionId =
        purchase.transactionId ??
        (
          await TransactionEntity.query.byUser({ userId: ctx.userId }).go()
        ).data.find((tx) => tx.referenceId === purchase.purchaseId)?.txId;

      await Promise.all([
        IPOPurchaseEntity.patch({ purchaseId: input.purchaseId })
          .set({ status: "claimed", claimedAt: now, txSig })
          .go(),
        ...(transactionId
          ? [
              TransactionEntity.patch({ txId: transactionId })
                .set({ status: "confirmed", txSig })
                .go(),
            ]
          : []),
      ]);

      return {
        purchaseId: purchase.purchaseId,
        status: "claimed" as const,
        walletAddress,
        txSig,
      };
    }),
});
