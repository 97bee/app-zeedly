import { router, protectedProcedure } from "./trpc.js";
import {
  TradeEntity,
  CreatorEntity,
  PriceHistoryEntity,
  DividendPaymentEntity,
  IPOPurchaseEntity,
  IPOEntity,
} from "../db/index.js";
import { getOffchainUsdtBalance } from "../services/offchain-wallet.js";

export const portfolioRouter = router({
  /**
   * Get user's full portfolio: off-chain USDT balance, token holdings, and
   * offering participations. Holdings include completed offering allocations.
   */
  getHoldings: protectedProcedure.query(async ({ ctx }) => {
    const [usdtBalance, tradesResult, purchasesResult] = await Promise.all([
      getOffchainUsdtBalance(ctx.userId),
      TradeEntity.query.byUser({ userId: ctx.userId }).go(),
      IPOPurchaseEntity.query.byUser({ userId: ctx.userId }).go(),
    ]);

    const confirmedTrades = tradesResult.data.filter((t) => t.status === "confirmed");
    const confirmedPurchases = purchasesResult.data.filter((p) => p.status === "confirmed");

    const ipoIds = [...new Set(purchasesResult.data.map((p) => p.ipoId))];
    const ipoResults = await Promise.all(
      ipoIds.map((ipoId) => IPOEntity.query.byIpoId({ ipoId }).go()),
    );
    const ipoMap = new Map(
      ipoResults.flatMap((r) => r.data.map((ipo) => [ipo.ipoId, ipo])),
    );

    // Aggregate net position per creator
    const positionMap = new Map<
      string,
      { quantity: number; totalCost: number; creatorId: string }
    >();

    for (const purchase of confirmedPurchases) {
      const ipo = ipoMap.get(purchase.ipoId);
      if (!ipo || ipo.status !== "closed") continue;

      const pos = positionMap.get(ipo.creatorId) ?? {
        quantity: 0,
        totalCost: 0,
        creatorId: ipo.creatorId,
      };

      pos.quantity += purchase.quantity;
      pos.totalCost += purchase.usdAmount;
      positionMap.set(ipo.creatorId, pos);
    }

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

    const offeringCreatorIds = [...new Set([...ipoMap.values()].map((ipo) => ipo.creatorId))];
    const creatorIds = [...new Set([...activePositions.map((p) => p.creatorId), ...offeringCreatorIds])];
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
    const fallbackPriceMap = new Map(
      [...ipoMap.values()]
        .filter((ipo) => ipo.status === "closed")
        .map((ipo) => [ipo.creatorId, ipo.pricePerToken]),
    );

    const holdings = activePositions.map((pos) => {
      const creator = creatorMap.get(pos.creatorId);
      const currentPrice = priceMap.get(pos.creatorId) || fallbackPriceMap.get(pos.creatorId) || 0;
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
    const offerings = purchasesResult.data.map((purchase) => {
      const ipo = ipoMap.get(purchase.ipoId);
      const creator = ipo ? creatorMap.get(ipo.creatorId) : null;
      const state = ipo?.status === "active"
        ? "live"
        : ipo?.status === "closed"
          ? "completed"
          : "coming_soon";

      return {
        purchaseId: purchase.purchaseId,
        ipoId: purchase.ipoId,
        creatorId: ipo?.creatorId ?? "",
        creatorName: creator?.name ?? "Unknown Creator",
        creatorSlug: creator?.slug ?? "",
        state,
        status: purchase.status,
        quantity: purchase.quantity,
        usdtAmount: purchase.usdAmount,
        pricePerToken: ipo?.pricePerToken ?? 0,
        startsAt: ipo?.startsAt ?? null,
        endsAt: ipo?.endsAt ?? null,
        kycRequiredBeforeClaim: state === "completed",
        claimStatus: state === "completed" ? "KYC required before token claim" : "Allocation pending",
        createdAt: purchase.createdAt,
      };
    });

    return {
      usdtBalance,
      usdcBalance: usdtBalance,
      holdings,
      offerings,
      totalPortfolioValue: usdtBalance + totalHoldingsValue,
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
