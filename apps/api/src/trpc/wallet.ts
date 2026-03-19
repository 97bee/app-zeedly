import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./trpc.js";
import { UserEntity, TransactionEntity } from "../db/index.js";
import { getUsdcBalance, getSolanaWallet } from "../services/solana.js";
import { stripe } from "../stripe/index.js";

export const walletRouter = router({
  /**
   * Get the user's USDC balance (read from Solana on-chain).
   * Also resolves and caches the wallet address in DynamoDB if not yet stored.
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
    const usdcBalance = walletAddress ? await getUsdcBalance(walletAddress) : 0;

    return { usdcBalance, walletAddress };
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
   * Create a Stripe PaymentIntent for depositing funds.
   * Platform receives USD, then transfers USDC to the user's wallet on confirmation.
   */
  depositIntent: protectedProcedure
    .input(z.object({ amountUsd: z.number().min(10).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Stripe is not configured",
        });
      }

      const { nanoid } = await import("nanoid");
      const txId = nanoid();

      // Record pending transaction
      await TransactionEntity.create({
        txId,
        userId: ctx.userId,
        type: "deposit",
        amount: input.amountUsd,
        status: "pending",
      }).go();

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(input.amountUsd * 100), // cents
        currency: "usd",
        metadata: { userId: ctx.userId, txId },
        automatic_payment_methods: { enabled: true },
      });

      return { clientSecret: paymentIntent.client_secret! };
    }),
});
