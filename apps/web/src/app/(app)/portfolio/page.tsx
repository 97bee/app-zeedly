"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  CircleDollarSign,
  Coins,
  Compass,
  DollarSign,
  Lock,
  Rocket,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { usePortfolioHoldings } from "@/features/portfolio/hooks/usePortfolioHoldings";
import { usePortfolioDividends } from "@/features/portfolio/hooks/usePortfolioDividends";
import { useMyTrades } from "@/features/trade/hooks/useMyTrades";
import { useClaimIpo } from "@/features/ipo/hooks/useClaimIpo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatUsdt(amount: number, signed = false): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const sign = signed ? (amount >= 0 ? "+" : "-") : "";
  return `${sign}${formatted} USDT`;
}

function formatDate(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(ts),
  );
}

function hashHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function CreatorAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const hue = hashHue(name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl font-black text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 50% 30%), hsl(${(hue + 60) % 360} 60% 22%))`,
        fontSize: size * 0.42,
      }}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: "lime" | "amber" | "emerald";
}) {
  const ring =
    accent === "lime"
      ? "from-lime/30 to-lime/5"
      : accent === "amber"
        ? "from-amber-200/40 to-amber-50/0"
        : accent === "emerald"
          ? "from-emerald-200/40 to-emerald-50/0"
          : "from-slate-200/60 to-slate-50/0";
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-slate-200 dark:border-slate-800/70 bg-white dark:bg-slate-900 p-5">
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl",
          ring,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-[24px] font-black tabular-nums tracking-[-0.04em] text-slate-950 dark:text-slate-50">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {hint}
            </p>
          ) : null}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  count,
  trailing,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 dark:border-slate-800/70 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/70 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <h2 className="text-[17px] font-black tracking-[-0.03em] text-slate-950 dark:text-slate-50">
            {title}
          </h2>
          {typeof count === "number" ? (
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-500 dark:text-slate-500">
              {count}
            </span>
          ) : null}
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500">{message}</p>
      {action}
    </div>
  );
}

function offeringStatusLabel(state: string) {
  if (state === "live") return "Live";
  if (state === "completed") return "Completed";
  return "Coming soon";
}

function offeringStatusTone(state: string) {
  if (state === "live")
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (state === "completed")
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-800";
  return "bg-amber-50 text-amber-700 border border-amber-100";
}

export default function PortfolioPage() {
  const { data: portfolio, isLoading, refetch } = usePortfolioHoldings();
  const { data: trades } = useMyTrades(20);
  const { data: dividends } = usePortfolioDividends();
  const claim = useClaimIpo({ onSuccess: () => refetch() });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-36 animate-pulse rounded-[24px] bg-slate-100 dark:bg-slate-800" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-[20px] bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-[22px] bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  const usdtBalance = portfolio?.usdtBalance ?? portfolio?.usdcBalance ?? 0;
  const lockedUsdt = portfolio?.lockedUsdtBalance ?? 0;
  const holdings = portfolio?.holdings ?? [];
  const offerings = portfolio?.offerings ?? [];
  const totalHoldingsValue = holdings.reduce(
    (sum, h) => sum + h.currentValue,
    0,
  );
  const totalValue =
    portfolio?.totalPortfolioValue ??
    usdtBalance + lockedUsdt + totalHoldingsValue;
  const totalGainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0);
  const totalCostBasis = totalHoldingsValue - totalGainLoss;
  const totalGainPct =
    totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;
  const gainPositive = totalGainLoss >= 0;

  return (
    <div className="relative space-y-7 pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(60%_60%_at_50%_0%,rgba(212,236,44,0.10),transparent_70%)]" />
        <div className="absolute -top-10 right-1/4 h-60 w-60 rounded-full bg-emerald-300/[0.08] blur-3xl" />
      </div>

      <motion.section
        className="relative overflow-hidden rounded-[28px] border border-slate-900/5 bg-slate-950 p-6 text-white shadow-[0_28px_64px_-24px_rgba(15,23,42,0.4)] sm:p-8"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              Portfolio
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[44px] font-black leading-none tracking-[-0.05em] sm:text-[56px]">
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(totalValue)}
              </h1>
              <span className="text-[18px] font-bold text-white/55">USDT</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-black tabular-nums",
                  gainPositive
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-red-400/15 text-red-300",
                )}
              >
                {gainPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {formatUsdt(totalGainLoss, true)}
                {totalCostBasis > 0 ? (
                  <span className="opacity-80">
                    ({gainPositive ? "+" : ""}
                    {totalGainPct.toFixed(2)}%)
                  </span>
                ) : null}
              </span>
              <span className="text-white/45">on holdings · all-time</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/portfolio">
                <Wallet className="h-4 w-4" />
                Deposit
              </Link>
            </Button>
            <Button
              asChild
              className="bg-lime text-slate-950 dark:text-slate-50 shadow-[0_12px_30px_rgba(212,236,44,0.32)] hover:bg-lime-dark hover:text-slate-950 dark:text-slate-50"
            >
              <Link href="/explore">
                <Compass className="h-4 w-4" />
                Discover creators
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <motion.div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <StatTile
          icon={CircleDollarSign}
          label="Available"
          value={formatUsdt(usdtBalance)}
          hint="Ready to invest"
          accent="lime"
        />
        <StatTile
          icon={Lock}
          label="Locked"
          value={formatUsdt(lockedUsdt)}
          hint="Pledged to active raises"
          accent="amber"
        />
        <StatTile
          icon={Coins}
          label="Holdings value"
          value={formatUsdt(totalHoldingsValue)}
          hint={`${holdings.length} ${holdings.length === 1 ? "token" : "tokens"}`}
        />
        <StatTile
          icon={Rocket}
          label="Offerings entered"
          value={offerings.length.toLocaleString()}
          hint={`${offerings.filter((o) => o.canClaim).length} claimable`}
          accent="emerald"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SectionCard title="Holdings" count={holdings.length}>
          {holdings.length === 0 ? (
            <EmptyRow
              message="No token holdings yet. Allocations from completed raises appear here."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/explore">
                    Browse raises <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {holdings.map((holding) => {
                const isPositive = holding.gainLoss >= 0;
                return (
                  <Link
                    key={holding.creatorId}
                    href={`/creator/${holding.creatorSlug}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CreatorAvatar name={holding.creatorName} />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-black tracking-[-0.02em] text-slate-950 dark:text-slate-50">
                          {holding.creatorName}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-500">
                          {holding.quantity.toFixed(4)} tokens · avg{" "}
                          {formatUsdt(holding.avgCostBasis)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-black tabular-nums text-slate-950 dark:text-slate-50">
                        {formatUsdt(holding.currentValue)}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 flex items-center justify-end gap-1 text-[12px] font-bold tabular-nums",
                          isPositive ? "text-emerald-600" : "text-red-500",
                        )}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {formatUsdt(holding.gainLoss, true)}
                        <span className="text-slate-400 dark:text-slate-500">
                          ({holding.gainLossPercent.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <SectionCard
          title="Offerings entered"
          icon={Rocket}
          count={offerings.length}
        >
          {offerings.length === 0 ? (
            <EmptyRow message="No offering entries yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {offerings.map((entry) => (
                <div
                  key={entry.purchaseId}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CreatorAvatar name={entry.creatorName} size={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.creatorSlug ? (
                          <Link
                            href={`/creator/${entry.creatorSlug}`}
                            className="truncate text-[14px] font-black tracking-[-0.02em] text-slate-950 dark:text-slate-50 hover:underline"
                          >
                            {entry.creatorName}
                          </Link>
                        ) : (
                          <p className="truncate text-[14px] font-black tracking-[-0.02em] text-slate-950 dark:text-slate-50">
                            {entry.creatorName}
                          </p>
                        )}
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
                            offeringStatusTone(entry.state),
                          )}
                        >
                          {offeringStatusLabel(entry.state)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-500">
                        {entry.quantity.toLocaleString()} tokens ·{" "}
                        {entry.claimStatus}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[14px] font-black tabular-nums text-slate-950 dark:text-slate-50">
                        {formatUsdt(entry.usdtAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    {entry.canClaim ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          claim.mutate({ purchaseId: entry.purchaseId })
                        }
                        disabled={claim.isPending}
                      >
                        {claim.isPending ? "Claiming..." : "Claim"}
                      </Button>
                    ) : entry.kycRequiredBeforeClaim ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href="/settings">KYC</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <SectionCard
            title="Trade history"
            icon={ArrowRightLeft}
            count={trades?.length ?? 0}
          >
            {!trades?.length ? (
              <EmptyRow message="No trades yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {trades.map((trade) => {
                  const isBuy = trade.side === "buy";
                  return (
                    <div
                      key={trade.tradeId}
                      className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black uppercase",
                            isBuy
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600",
                          )}
                        >
                          {isBuy ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-black tracking-[-0.02em] text-slate-950 dark:text-slate-50">
                            {trade.creatorName}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-500">
                            {isBuy ? "Buy" : "Sell"} ·{" "}
                            {trade.quantity.toFixed(4)} @{" "}
                            {formatUsdt(trade.price)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-[13px] font-black tabular-nums",
                            isBuy ? "text-red-500" : "text-emerald-600",
                          )}
                        >
                          {isBuy ? "-" : "+"}
                          {formatUsdt(trade.usdAmount)}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatDate(trade.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          <SectionCard
            title="Dividends"
            icon={DollarSign}
            count={dividends?.length ?? 0}
          >
            {!dividends?.length ? (
              <EmptyRow message="No dividends received yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {dividends.map((dividend) => (
                  <div
                    key={dividend.paymentId}
                    className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lime/20 text-slate-950 dark:text-slate-50">
                        <DollarSign className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black tracking-[-0.02em] text-slate-950 dark:text-slate-50">
                          Dividend payment
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-500">
                          {dividend.tokenBalanceAtSnapshot.toFixed(4)} tokens at
                          snapshot
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-black tabular-nums text-emerald-600">
                        +{formatUsdt(dividend.usdcAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDate(dividend.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>
      </div>
    </div>
  );
}
