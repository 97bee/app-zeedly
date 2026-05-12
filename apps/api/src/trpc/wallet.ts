import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./trpc.js";
import { UserEntity, TransactionEntity } from "../db/index.js";
import { getSolanaWallet } from "../services/solana.js";
import {
  getOffchainWalletSummary,
  normalizeFiatCurrency,
  quoteFiatToUsdt,
} from "../services/offchain-wallet.js";
import { stripe } from "../stripe/index.js";

const depositInput = z.object({
  amount: z.number().min(10).max(10000),
  currency: z.enum(["GBP", "USD", "EUR", "gbp", "usd", "eur"]).default("GBP"),
});

function toMinorUnits(amount: number, currency: string) {
  // Supported currencies are all 2-decimal currencies.
  return Math.round(amount * 100);
}

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
    const wallet = await getOffchainWalletSummary(ctx.userId);

    return {
      asset: "USDT" as const,
      usdtBalance: wallet.availableUsdtBalance,
      usdcBalance: wallet.availableUsdtBalance,
      availableUsdtBalance: wallet.availableUsdtBalance,
      lockedUsdtBalance: wallet.lockedUsdtBalance,
      totalUsdtBalance: wallet.totalUsdtBalance,
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
   * Quote fiat deposits into internal USDT.
   */
  quoteDeposit: protectedProcedure
    .input(depositInput)
    .query(async ({ input }) => {
      return quoteFiatToUsdt(input.amount, input.currency);
    }),

  /**
   * Create a Stripe PaymentIntent. The user's internal USDT balance is credited
   * only after the signed Stripe webhook confirms successful payment.
   */
  createDepositIntent: protectedProcedure
    .input(depositInput)
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe is not configured for deposits",
        });
      }

      const { nanoid } = await import("nanoid");
      const txId = nanoid();
      const quote = quoteFiatToUsdt(input.amount, input.currency);
      const currency = normalizeFiatCurrency(input.currency);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: toMinorUnits(quote.fiatAmount, currency),
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          txId,
          userId: ctx.userId,
          fiatAmount: String(quote.fiatAmount),
          fiatCurrency: quote.fiatCurrency,
          usdtAmount: String(quote.usdtAmount),
        },
      });

      await TransactionEntity.create({
        txId,
        userId: ctx.userId,
        type: "deposit",
        amount: quote.usdtAmount,
        asset: quote.asset,
        fiatAmount: quote.fiatAmount,
        fiatCurrency: quote.fiatCurrency,
        exchangeRate: quote.exchangeRate,
        referenceId: paymentIntent.id,
        status: "pending",
      }).go();

      return {
        txId,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        ...quote,
      };
    }),
});
