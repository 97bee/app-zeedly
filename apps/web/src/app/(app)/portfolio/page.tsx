"use client";

import { TrendingUp, TrendingDown, ArrowRightLeft, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function PortfolioPage() {
  const { data: portfolio, isLoading } = trpc.portfolio.getHoldings.useQuery();
  const { data: trades } = trpc.trade.myTrades.useQuery({ limit: 20 });
  const { data: dividends } = trpc.portfolio.dividends.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  const usdcBalance = portfolio?.usdcBalance ?? 0;
  const holdings = portfolio?.holdings ?? [];
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalValue = portfolio?.totalPortfolioValue ?? 0;
  const totalGainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0);

  return (
    <div>
      <motion.h1
        className="mb-8 text-3xl font-bold font-serif text-zinc-900"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Portfolio
      </motion.h1>

      {/* Summary Cards */}
      <motion.div
        className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {[
          { label: "Total Value", value: formatUSD(totalValue) },
          { label: "USDC Balance", value: formatUSD(usdcBalance) },
          { label: "Holdings Value", value: formatUSD(totalHoldingsValue) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-400">{card.label}</p>
            <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-400">Total Gain/Loss</p>
          <p className={`flex items-center gap-1 text-2xl font-bold ${totalGainLoss >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {totalGainLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {totalGainLoss >= 0 ? "+" : ""}{formatUSD(totalGainLoss)}
          </p>
        </div>
      </motion.div>

      {/* Holdings */}
      <motion.div
        className="rounded-2xl border border-zinc-200 bg-white"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Holdings</h2>
        </div>
        {holdings.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-400">
            No holdings yet. Buy creator tokens to get started.
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {holdings.map((holding) => {
              const isPositive = holding.gainLoss >= 0;
              return (
                <a
                  key={holding.creatorId}
                  href={`/creator/${holding.creatorSlug}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime/30 font-bold text-zinc-900">
                      {holding.creatorName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{holding.creatorName}</p>
                      <p className="text-sm text-zinc-400">
                        {holding.quantity.toFixed(4)} tokens @ {formatUSD(holding.avgCostBasis)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-900">{formatUSD(holding.currentValue)}</p>
                    <p className={`flex items-center justify-end gap-1 text-sm ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isPositive ? "+" : ""}{formatUSD(holding.gainLoss)} ({holding.gainLossPercent.toFixed(1)}%)
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Trade History */}
      <motion.div
        className="mt-6 rounded-2xl border border-zinc-200 bg-white"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <ArrowRightLeft className="h-5 w-5 text-zinc-400" />
            Trade History
          </h2>
        </div>
        {!trades?.length ? (
          <div className="px-6 py-12 text-center text-zinc-400">No trades yet</div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {trades.map((trade) => (
              <div key={trade.tradeId} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    trade.side === "buy" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}>
                    {trade.side.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{trade.creatorName}</p>
                    <p className="text-xs text-zinc-400">
                      {trade.quantity.toFixed(4)} tokens @ {formatUSD(trade.price)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${trade.side === "buy" ? "text-red-500" : "text-emerald-600"}`}>
                    {trade.side === "buy" ? "-" : "+"}{formatUSD(trade.usdAmount)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(trade.createdAt ?? 0).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Dividend History */}
      <motion.div
        className="mt-6 rounded-2xl border border-zinc-200 bg-white"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <DollarSign className="h-5 w-5 text-zinc-400" />
            Dividend History
          </h2>
        </div>
        {!dividends?.length ? (
          <div className="px-6 py-12 text-center text-zinc-400">No dividends received yet</div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {dividends.map((d) => (
              <div key={d.paymentId} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Dividend Payment</p>
                  <p className="text-xs text-zinc-400">{d.tokenBalanceAtSnapshot.toFixed(4)} tokens at snapshot</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600">+{formatUSD(d.usdcAmount)}</p>
                  <p className="text-xs text-zinc-400">{new Date(d.createdAt ?? 0).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
