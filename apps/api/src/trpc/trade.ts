import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import {
  TradeEntity,
  TransactionEntity,
  PriceHistoryEntity,
  CreatorEntity,
  IPOPurchaseEntity,
  IPOEntity,
} from "../db/index.js";
import { getOffchainUsdtBalance } from "../services/offchain-wallet.js";
// 1% total trading fee (0.5% to creator, 0.5% to platform)
const TRADING_FEE_BPS = 100;

/**
 * Get the latest traded price for a creator.
 * Falls back to null if no price history exists.
 */
async function getLatestPrice(creatorId: string): Promise<number | null> {
  const result = await PriceHistoryEntity.query
    .byCreator({ creatorId })
    .go({ order: "desc", limit: 1 });
  const latestPrice = result.data[0]?.price;
  if (latestPrice) return latestPrice;

  const ipos = await IPOEntity.query.byCreator({ creatorId }).go();
  const completedOffering = ipos.data.find((ipo) => ipo.status === "closed");
  return completedOffering?.pricePerToken ?? null;
}

async function getConfirmedTokenPosition(userId: string, creatorId: string): Promise<number> {
  const [trades, purchases] = await Promise.all([
    TradeEntity.query.byUser({ userId }).go(),
    IPOPurchaseEntity.query.byUser({ userId }).go(),
  ]);

  let quantity = trades.data
    .filter((t) => t.creatorId === creatorId && t.status === "confirmed")
    .reduce((sum, t) => sum + (t.side === "buy" ? t.quantity : -t.quantity), 0);

  const confirmedPurchases = purchases.data.filter((p) => p.status === "claimed" || p.status === "confirmed");
  if (confirmedPurchases.length === 0) return quantity;

  const ipos = await Promise.all(
    confirmedPurchases.map((p) => IPOEntity.query.byIpoId({ ipoId: p.ipoId }).go()),
  );

  for (let i = 0; i < confirmedPurchases.length; i += 1) {
    const ipo = ipos[i].data[0];
    if (ipo?.creatorId === creatorId && ipo.status === "closed") {
      quantity += confirmedPurchases[i].quantity;
    }
  }

  return quantity;
}

export const tradeRouter = router({
  /**
   * Get the latest price for a creator token.
   */
  price: publicProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ input }) => {
      const price = await getLatestPrice(input.creatorId);
      return { price };
    }),

  /**
   * Get price history for a creator (for charts).
   */
  priceHistory: publicProcedure
    .input(
      z.object({
        creatorId: z.string(),
        limit: z.number().int().min(1).max(500).default(100),
      }),
    )
    .query(async ({ input }) => {
      const result = await PriceHistoryEntity.query
        .byCreator({ creatorId: input.creatorId })
        .go({ order: "desc", limit: input.limit });
      return result.data.reverse(); // oldest first for charting
    }),

  /**
   * Execute a buy or sell trade.
   *
   * The platform acts as market maker — trades execute at the current price.
   * 1% fee split 50/50 between creator and platform.
   */
  execute: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        side: z.enum(["buy", "sell"]),
        usdAmount: z.number().positive().max(1_000_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { nanoid } = await import("nanoid");

      // Verify creator exists and is live
      const creatorResult = await CreatorEntity.query
        .byCreatorId({ creatorId: input.creatorId })
        .go();
      const creator = creatorResult.data[0];
      if (!creator || creator.status !== "live") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Creator is not live for trading" });
      }

      // Get current price
      const currentPrice = await getLatestPrice(input.creatorId);
      if (!currentPrice) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No price established for this creator yet",
        });
      }

      // Calculate trade
      const feeRate = TRADING_FEE_BPS / 10_000; // 0.01
      const grossAmount = input.usdAmount;
      const fee = Math.round(grossAmount * feeRate * 100) / 100;
      const netAmount = grossAmount - fee;
      const quantity = Math.floor((netAmount / currentPrice) * 1_000_000) / 1_000_000; // 6 decimal precision

      if (quantity <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Trade amount too small" });
      }

      if (input.side === "buy") {
        const balance = await getOffchainUsdtBalance(ctx.userId);
        if (balance < grossAmount) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Insufficient USDT balance. Available: ${balance.toFixed(2)} USDT`,
          });
        }
      }

      // For sells: verify user has enough tokens
      if (input.side === "sell") {
        const netPosition = await getConfirmedTokenPosition(ctx.userId, input.creatorId);

        if (quantity > netPosition) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Insufficient balance. You hold ${netPosition.toFixed(6)} tokens`,
          });
        }
      }

      const tradeId = nanoid();
      const txId = nanoid();
      const priceId = nanoid();
      const now = Date.now();

      // Record trade, transaction, and price history
      await Promise.all([
        TradeEntity.create({
          tradeId,
          userId: ctx.userId,
          creatorId: input.creatorId,
          side: input.side,
          quantity,
          usdAmount: grossAmount,
          price: currentPrice,
          fee,
          status: "confirmed",
        }).go(),
        TransactionEntity.create({
          txId,
          userId: ctx.userId,
          type: "trade",
          amount: input.side === "buy" ? -grossAmount : netAmount,
          asset: "USDT",
          referenceId: tradeId,
          status: "confirmed",
        }).go(),
        // Record price point (for now price stays the same; later AMM adjusts it)
        PriceHistoryEntity.create({
          priceId,
          creatorId: input.creatorId,
          price: currentPrice,
          timestamp: now,
        }).go(),
      ]);

      return {
        tradeId,
        side: input.side,
        quantity,
        price: currentPrice,
        fee,
        netAmount,
        grossAmount,
      };
    }),

  /**
   * User's trade history (all creators).
   */
  myTrades: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const result = await TradeEntity.query
        .byUser({ userId: ctx.userId })
        .go({ order: "desc", limit: input?.limit ?? 50 });

      // Enrich with creator names
      const creatorIds = [...new Set(result.data.map((t) => t.creatorId))];
      const creators = await Promise.all(
        creatorIds.map((id) => CreatorEntity.query.byCreatorId({ creatorId: id }).go()),
      );
      const creatorMap = new Map(
        creators.flatMap((r) => r.data.map((c) => [c.creatorId, c])),
      );

      return result.data.map((trade) => ({
        ...trade,
        creatorName: creatorMap.get(trade.creatorId)?.name ?? "Unknown",
        creatorSlug: creatorMap.get(trade.creatorId)?.slug ?? "",
      }));
    }),

  /**
   * Recent trades for a specific creator.
   */
  creatorTrades: publicProcedure
    .input(
      z.object({
        creatorId: z.string(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const result = await TradeEntity.query
        .byCreator({ creatorId: input.creatorId })
        .go({ order: "desc", limit: input.limit });
      return result.data;
    }),
});
