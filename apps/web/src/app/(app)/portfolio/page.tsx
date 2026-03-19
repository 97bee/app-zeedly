"use client";

import { TrendingUp, TrendingDown, ArrowRightLeft, DollarSign } from "lucide-react";
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
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-900" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-zinc-900" />
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
      <h1 className="mb-8 text-3xl font-bold">Portfolio</h1>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">Total Value</p>
          <p className="text-2xl font-bold">{formatUSD(totalValue)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">USDC Balance</p>
          <p className="text-2xl font-bold">{formatUSD(usdcBalance)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">Holdings Value</p>
          <p className="text-2xl font-bold">{formatUSD(totalHoldingsValue)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">Total Gain/Loss</p>
          <p
            className={`flex items-center gap-1 text-2xl font-bold ${
              totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            {totalGainLoss >= 0 ? "+" : ""}
            {formatUSD(totalGainLoss)}
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold">Holdings</h2>
        </div>
        {holdings.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-500">
            No holdings yet. Buy creator tokens to get started.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {holdings.map((holding) => {
              const isPositive = holding.gainLoss >= 0;
              return (
                <a
                  key={holding.creatorId}
                  href={`/creator/${holding.creatorSlug}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 font-bold">
                      {holding.creatorName[0]}
                    </div>
                    <div>
                      <p className="font-medium">{holding.creatorName}</p>
                      <p className="text-sm text-zinc-500">
                        {holding.quantity.toFixed(4)} tokens @ {formatUSD(holding.avgCostBasis)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatUSD(holding.currentValue)}</p>
                    <p
                      className={`flex items-center justify-end gap-1 text-sm ${
                        isPositive ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {formatUSD(holding.gainLoss)} ({holding.gainLossPercent.toFixed(1)}%)
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Trade History */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ArrowRightLeft className="h-5 w-5" />
            Trade History
          </h2>
        </div>
        {!trades?.length ? (
          <div className="px-6 py-12 text-center text-zinc-500">No trades yet</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {trades.map((trade) => (
              <div
                key={trade.tradeId}
                className="flex items-center justify-between px-6 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      trade.side === "buy"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {trade.side.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{trade.creatorName}</p>
                    <p className="text-xs text-zinc-500">
                      {trade.quantity.toFixed(4)} tokens @ {formatUSD(trade.price)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      trade.side === "buy" ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {trade.side === "buy" ? "-" : "+"}
                    {formatUSD(trade.usdAmount)}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {new Date(trade.createdAt ?? 0).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dividend History */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5" />
            Dividend History
          </h2>
        </div>
        {!dividends?.length ? (
          <div className="px-6 py-12 text-center text-zinc-500">No dividends received yet</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {dividends.map((d) => (
              <div
                key={d.paymentId}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="text-sm font-medium">Dividend Payment</p>
                  <p className="text-xs text-zinc-500">
                    {d.tokenBalanceAtSnapshot.toFixed(4)} tokens at snapshot
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-400">
                    +{formatUSD(d.usdcAmount)}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {new Date(d.createdAt ?? 0).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
