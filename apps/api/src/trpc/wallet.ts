import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./trpc.js";
import { UserEntity, TransactionEntity } from "../db/index.js";
import { getSolanaWallet } from "../services/solana.js";
import { getOffchainUsdtBalance, quoteGbpToUsdt } from "../services/offchain-wallet.js";

export const walletRouter = router({
  /**
   * Get the user's off-chain USDT balance.
   * Solana wallet resolution remains for future token claim flows, but the
   * investable balance is now the app ledger linked to the user's account.
   */
  balance: protectedProcedure.query(async ({ ctx }) => {
    const userResult = await UserEntity.query.byUserId({ userId: ctx.userId }).go();
    let user = userResult.data[0];
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    // Resolve wallet address if not yet stored
    if (!user.solanaPubkey && user.openfortUserId) {
      const address = await getSolanaWallet(user.openfortUserId);
      if (address) {
        await UserEntity.patch({ userId: ctx.userId }).set({ solanaPubkey: address }).go();
        user = { ...user, solanaPubkey: address };
      }
    }

    const walletAddress = user.solanaPubkey ?? null;
    const usdtBalance = await getOffchainUsdtBalance(ctx.userId);

    return {
      asset: "USDT" as const,
      usdtBalance,
      usdcBalance: usdtBalance,
      walletAddress,
    };
  }),

  /**
   * List the user's transaction history.
   */
  transactions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const result = await TransactionEntity.query
        .byUser({ userId: ctx.userId })
        .go({ limit: input?.limit ?? 50 });
      return result.data;
    }),

  /**
   * Quote GBP deposits into USDT.
   */
  quoteDeposit: protectedProcedure
    .input(z.object({ amountGbp: z.number().min(10).max(10000) }))
    .query(async ({ input }) => {
      return quoteGbpToUsdt(input.amountGbp);
    }),

  /**
   * Credit a GBP deposit into the user's off-chain USDT balance.
   * This records the ledger movement that later payment/KYC rails can gate.
   */
  deposit: protectedProcedure
    .input(z.object({ amountGbp: z.number().min(10).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const { nanoid } = await import("nanoid");
      const txId = nanoid();
      const quote = quoteGbpToUsdt(input.amountGbp);

      await TransactionEntity.create({
        txId,
        userId: ctx.userId,
        type: "deposit",
        amount: quote.usdtAmount,
        asset: quote.asset,
        fiatAmount: quote.fiatAmount,
        fiatCurrency: quote.fiatCurrency,
        exchangeRate: quote.exchangeRate,
        status: "confirmed",
      }).go();

      return {
        txId,
        ...quote,
        balance: await getOffchainUsdtBalance(ctx.userId),
      };
    }),
});
