import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import { IPOEntity, IPOPurchaseEntity, TransactionEntity, CreatorEntity } from "../db/index.js";
import { getOffchainUsdtBalance } from "../services/offchain-wallet.js";

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
        .filter((purchase) => purchase.ipoId === input.ipoId && purchase.status !== "failed")
        .reduce((sum, purchase) => sum + purchase.usdAmount, 0);
      const remainingAccountCapUsd = maxInvestmentPerAccountUsd - userInvestedUsd;
      if (remainingAccountCapUsd < ipo.pricePerToken || usdAmount > remainingAccountCapUsd) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Max investment for this offering is ${maxInvestmentPerAccountUsd.toFixed(2)} USDT per account`,
        });
      }

      const balance = await getOffchainUsdtBalance(ctx.userId);
      if (balance < usdAmount) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Insufficient USDT balance. Available: ${balance.toFixed(2)} USDT`,
        });
      }

      const purchaseId = nanoid();
      const txId = nanoid();
      const newRaisedUsd = raisedUsd + usdAmount;
      const newSold = sold + input.quantity;
      const offeringComplete = newRaisedUsd >= raiseTargetUsd;
      const now = Date.now();
      const offeringPatch = offeringComplete
        ? IPOEntity.patch({ ipoId: input.ipoId }).set({
            sold: newSold,
            raisedUsd: newRaisedUsd,
            status: "closed",
            completedAt: now,
            tokenMintedAt: now,
            tokenDispersedAt: now,
          })
        : IPOEntity.patch({ ipoId: input.ipoId }).set({
            sold: newSold,
            raisedUsd: newRaisedUsd,
          });

      await Promise.all([
        IPOPurchaseEntity.create({
          purchaseId,
          ipoId: input.ipoId,
          userId: ctx.userId,
          quantity: input.quantity,
          usdAmount,
          asset: "USDT",
          status: "confirmed",
        }).go(),
        TransactionEntity.create({
          txId,
          userId: ctx.userId,
          type: "ipo_purchase",
          amount: -usdAmount,
          asset: "USDT",
          referenceId: purchaseId,
          status: "confirmed",
        }).go(),
        offeringPatch.go(),
      ]);

      return {
        purchaseId,
        txId,
        usdAmount,
        asset: "USDT" as const,
        offeringComplete,
      };
    }),
});
