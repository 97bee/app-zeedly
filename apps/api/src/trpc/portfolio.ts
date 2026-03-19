import { router, protectedProcedure } from "./trpc.js";
import { TradeEntity, CreatorEntity, PriceHistoryEntity, DividendPaymentEntity } from "../db/index.js";
import { getUsdcBalance, getSolanaWallet } from "../services/solana.js";
import { UserEntity } from "../db/index.js";

export const portfolioRouter = router({
  /**
   * Get user's full portfolio: USDC balance + token holdings with current values.
   * Holdings are computed by aggregating all confirmed trades.
   */
  getHoldings: protectedProcedure.query(async ({ ctx }) => {
    // Get USDC balance from Solana
    let usdcBalance = 0;
    const userResult = await UserEntity.query.byUserId({ userId: ctx.userId }).go();
    const user = userResult.data[0];
    if (user?.solanaPubkey) {
      try {
        usdcBalance = await getUsdcBalance(user.solanaPubkey);
      } catch {
        // If RPC fails, leave balance at 0
      }
    }

    // Get all confirmed trades for this user
    const tradesResult = await TradeEntity.query.byUser({ userId: ctx.userId }).go();
    const confirmedTrades = tradesResult.data.filter((t) => t.status === "confirmed");

    // Aggregate net position per creator
    const positionMap = new Map<
      string,
      { quantity: number; totalCost: number; creatorId: string }
    >();

    for (const trade of confirmedTrades) {
      const pos = positionMap.get(trade.creatorId) ?? {
        quantity: 0,
        totalCost: 0,
        creatorId: trade.creatorId,
      };

      if (trade.side === "buy") {
        pos.quantity += trade.quantity;
        pos.totalCost += trade.usdAmount;
      } else {
        // For sells, reduce position and proportionally reduce cost basis
        const sellRatio = Math.min(trade.quantity / pos.quantity, 1);
        pos.totalCost -= pos.totalCost * sellRatio;
        pos.quantity -= trade.quantity;
      }

      // Clean up dust
      if (pos.quantity < 0.000001) {
        pos.quantity = 0;
        pos.totalCost = 0;
      }

      positionMap.set(trade.creatorId, pos);
    }

    // Filter out zero positions
    const activePositions = [...positionMap.values()].filter((p) => p.quantity > 0);

    if (activePositions.length === 0) {
      return { usdcBalance, holdings: [], totalPortfolioValue: usdcBalance };
    }

    // Fetch creator details and latest prices
    const creatorIds = activePositions.map((p) => p.creatorId);
    const [creatorsData, pricesData] = await Promise.all([
      Promise.all(creatorIds.map((id) => CreatorEntity.query.byCreatorId({ creatorId: id }).go())),
      Promise.all(
        creatorIds.map((id) =>
          PriceHistoryEntity.query.byCreator({ creatorId: id }).go({ order: "desc", limit: 1 }),
        ),
      ),
    ]);

    const creatorMap = new Map(
      creatorsData.flatMap((r) => r.data.map((c) => [c.creatorId, c])),
    );
    const priceMap = new Map(
      pricesData.map((r, i) => [creatorIds[i], r.data[0]?.price ?? 0]),
    );

    const holdings = activePositions.map((pos) => {
      const creator = creatorMap.get(pos.creatorId);
      const currentPrice = priceMap.get(pos.creatorId) ?? 0;
      const currentValue = pos.quantity * currentPrice;
      const avgCostBasis = pos.totalCost / pos.quantity;
      const gainLoss = currentValue - pos.totalCost;
      const gainLossPercent = pos.totalCost > 0 ? (gainLoss / pos.totalCost) * 100 : 0;

      return {
        creatorId: pos.creatorId,
        creatorName: creator?.name ?? "Unknown",
        creatorSlug: creator?.slug ?? "",
        tokenMint: creator?.tokenMint ?? null,
        quantity: pos.quantity,
        currentPrice,
        currentValue,
        avgCostBasis,
        gainLoss,
        gainLossPercent,
      };
    });

    const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

    return {
      usdcBalance,
      holdings,
      totalPortfolioValue: usdcBalance + totalHoldingsValue,
    };
  }),

  /**
   * Get user's dividend payment history.
   */
  dividends: protectedProcedure.query(async ({ ctx }) => {
    const result = await DividendPaymentEntity.query
      .byUser({ userId: ctx.userId })
      .go({ order: "desc", limit: 50 });
    return result.data;
  }),
});
