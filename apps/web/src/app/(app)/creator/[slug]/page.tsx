"use client";

import { use, useState } from "react";
import Image from "next/image";
import {
  ArrowRightLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Eye,
  LineChart,
  PlayCircle,
  Rocket,
  Tag,
  TrendingUp,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type ChartPoint = { label: string; value: number };

type CreatorAnalytics = {
  subscriberHistory?: ChartPoint[];
  subscriberProjection?: ChartPoint[];
  totalViewsHistory?: ChartPoint[];
};

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatUsdt(amount: number, maximumFractionDigits = 0): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(amount)} USDT`;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(ts));
}

function fallbackSeries(current: number, labels: string[], startMultiplier: number, endMultiplier = 1) {
  const safeCurrent = Math.max(current, 1);
  return labels.map((label, index) => {
    const progress = labels.length === 1 ? 1 : index / (labels.length - 1);
    const multiplier = startMultiplier + (endMultiplier - startMultiplier) * progress;
    return { label, value: Math.round(safeCurrent * multiplier) };
  });
}

function getAnalytics(value: unknown): CreatorAnalytics {
  if (!value || typeof value !== "object") return {};
  return value as CreatorAnalytics;
}

function MiniLineChart({
  data,
  tone = "emerald",
  valueFormatter = formatNumber,
}: {
  data: ChartPoint[];
  tone?: "emerald" | "zinc" | "lime";
  valueFormatter?: (value: number) => string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data.map((point) => point.value));
  const max = Math.max(...data.map((point) => point.value));
  const range = max - min || 1;
  const width = 640;
  const height = 180;
  const padX = 18;
  const padY = 18;
  const color = tone === "lime" ? "#a3c614" : tone === "zinc" ? "#71717a" : "#059669";

  const points = data.map((point, index) => {
    const x = padX + (index / (data.length - 1)) * (width - padX * 2);
    const y = height - padY - ((point.value - min) / range) * (height - padY * 2);
    return { ...point, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <circle key={`${point.label}-${point.value}`} cx={point.x} cy={point.y} r="4" fill={color} />
        ))}
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-400">
        <span>{data[0].label}</span>
        <span className="text-center text-slate-500">{valueFormatter(data[Math.floor(data.length / 2)].value)}</span>
        <span className="text-right">{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}

function ChartPanel({
  title,
  icon: Icon,
  data,
  tone,
  valueFormatter,
}: {
  title: string;
  icon: LucideIcon;
  data: ChartPoint[];
  tone?: "emerald" | "zinc" | "lime";
  valueFormatter?: (value: number) => string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Icon className="h-4 w-4 text-slate-400" />
          {title}
        </h3>
        <span className="text-xs text-slate-400">{formatNumber(data[data.length - 1]?.value ?? 0)}</span>
      </div>
      <MiniLineChart data={data} tone={tone} valueFormatter={valueFormatter} />
    </div>
  );
}

function OfferingInvestForm({
  ipoId,
  pricePerToken,
  remaining,
  remainingRaiseUsd,
  maxInvestmentPerAccountUsd,
  onSuccess,
}: {
  ipoId: string;
  pricePerToken: number;
  remaining: number;
  remainingRaiseUsd: number;
  maxInvestmentPerAccountUsd: number;
  onSuccess: () => void;
}) {
  const [amountStr, setAmountStr] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const purchase = trpc.ipo.purchase.useMutation();
  const { data: balance } = trpc.wallet.balance.useQuery();
  const amount = Number.parseFloat(amountStr) || 0;
  const quantity = Math.floor(amount / pricePerToken);
  const committed = quantity * pricePerToken;
  const available = balance?.usdtBalance ?? balance?.usdcBalance ?? 0;

  async function handleInvest() {
    if (quantity < 1) {
      setError("Enter enough USDT to buy at least 1 token");
      return;
    }
    if (quantity > remaining) {
      setError("That is more than the remaining allocation");
      return;
    }
    if (committed > remainingRaiseUsd) {
      setError("That is more than the remaining raise target");
      return;
    }
    if (committed > maxInvestmentPerAccountUsd) {
      setError(`Max investment for this offering is ${formatUsdt(maxInvestmentPerAccountUsd, 2)}`);
      return;
    }
    if (committed > available) {
      setError("Insufficient USDT balance");
      return;
    }

    setError(null);
    try {
      await purchase.mutateAsync({ ipoId, quantity });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investment failed");
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
        <p className="mt-2 font-semibold text-emerald-700">Participation confirmed</p>
        <p className="mt-1 text-sm text-zinc-500">Your USDT is locked. KYC is required before claiming tokens after completion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-zinc-500">Lock from available USDT balance</label>
        <input
          type="number"
          min={pricePerToken}
          max={Math.min(remaining * pricePerToken, remainingRaiseUsd, maxInvestmentPerAccountUsd)}
          value={amountStr}
          onChange={(event) => setAmountStr(event.target.value)}
          className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-lg text-slate-950 placeholder-slate-400 transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/5"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Available: {formatUsdt(available, 2)} / Left: {formatUsdt(remainingRaiseUsd, 2)} / Max: {formatUsdt(maxInvestmentPerAccountUsd, 2)}
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Estimated tokens</span>
          <span className="font-medium text-slate-950">{quantity.toLocaleString()}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-slate-500">USDT to lock</span>
          <span className="font-medium text-slate-950">{formatUsdt(committed, 2)}</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <Button onClick={handleInvest} disabled={purchase.isPending || quantity < 1} className="w-full">
        {purchase.isPending ? "Locking..." : "Lock pledge"}
      </Button>
    </div>
  );
}

function TradeForm({
  creatorId,
  creatorName,
  currentPrice,
  onTraded,
}: {
  creatorId: string;
  creatorName: string;
  currentPrice: number;
  onTraded: () => void;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ side: string; quantity: number; price: number; fee: number } | null>(null);
  const trade = trpc.trade.execute.useMutation();
  const usdtAmount = Number.parseFloat(amount) || 0;
  const estQuantity = currentPrice > 0 ? (usdtAmount * 0.99) / currentPrice : 0;

  async function handleTrade() {
    if (usdtAmount < 0.01) {
      setError("Enter a valid amount");
      return;
    }

    setError(null);
    try {
      const response = await trade.mutateAsync({ creatorId, side, usdAmount: usdtAmount });
      setResult(response);
      onTraded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trade failed");
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
          <p className="font-semibold text-emerald-700">
            {result.side === "buy" ? "Bought" : "Sold"} {result.quantity.toFixed(4)} tokens
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            At {formatUsdt(result.price, 2)} / Fee {formatUsdt(result.fee, 2)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setResult(null);
            setAmount("");
          }}
          className="w-full"
        >
          New trade
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1">
        {(["buy", "sell"] as const).map((option) => (
          <button
            key={option}
            onClick={() => {
              setSide(option);
              setError(null);
            }}
            className={`rounded-lg py-2 text-sm font-medium transition-colors ${
              side === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
            }`}
          >
            {option === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-500">Amount (USDT)</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-lg text-slate-950 placeholder-slate-400 transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/5"
        />
      </div>

      {usdtAmount > 0 ? (
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Estimated tokens</span>
            <span className="font-medium text-zinc-900">
              {estQuantity.toFixed(4)} {creatorName}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <span>Trading fee</span>
            <span>{formatUsdt(usdtAmount * 0.01, 2)}</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <Button
        onClick={handleTrade}
        disabled={trade.isPending || usdtAmount < 0.01}
        variant={side === "sell" ? "danger" : "default"}
        className="w-full"
      >
        {trade.isPending ? "Processing..." : `${side === "buy" ? "Buy" : "Sell"} tokens`}
      </Button>
    </div>
  );
}

function RecentTrades({ creatorId }: { creatorId: string }) {
  const { data: trades, isLoading } = trpc.trade.creatorTrades.useQuery(
    { creatorId, limit: 8 },
    { refetchInterval: 15_000 },
  );

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />;
  if (!trades?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-400 shadow-sm">
        No token trades yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-950">Recent Trades</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {trades.map((trade) => (
          <div key={trade.tradeId} className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  trade.side === "buy" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {trade.side.toUpperCase()}
              </span>
              <span className="text-sm text-slate-700">{trade.quantity.toFixed(4)} tokens</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-950">{formatUsdt(trade.usdAmount, 2)}</p>
              <p className="text-xs text-slate-400">At {formatUsdt(trade.price, 2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [notified, setNotified] = useState(false);
  const { data: creator, isLoading } = trpc.creator.getBySlug.useQuery({ slug });
  const { data: ipos, refetch: refetchIpos } = trpc.ipo.getByCreator.useQuery(
    { creatorId: creator?.creatorId ?? "" },
    { enabled: !!creator?.creatorId },
  );
  const { data: priceData, refetch: refetchPrice } = trpc.trade.price.useQuery(
    { creatorId: creator?.creatorId ?? "" },
    { enabled: !!creator?.creatorId, refetchInterval: 10_000 },
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-80 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
        Creator not found.
      </div>
    );
  }

  const activeOffering = ipos?.find((ipo) => ipo.status === "active");
  const upcomingOffering = ipos?.find((ipo) => ipo.status === "upcoming");
  const completedOffering = ipos?.find((ipo) => ipo.status === "closed");
  const primaryOffering = activeOffering ?? upcomingOffering ?? completedOffering;
  const currentPrice = priceData?.price ?? completedOffering?.pricePerToken ?? null;
  const analytics = getAnalytics(creator.analytics);
  const totalViews = creator.totalViews || Math.max((creator.avgViews ?? 0) * 240, (creator.subscriberCount ?? 0) * 20);
  const estimatedMonthlyDividend =
    creator.estimatedMonthlyDividend || (creator.monthlyRevenue ?? 0) * ((creator.revenueShareBps ?? 0) / 10000);
  const raiseTarget = primaryOffering
    ? primaryOffering.raiseTargetUsd || primaryOffering.totalSupply * primaryOffering.pricePerToken
    : creator.valuation ?? 0;
  const accountMax = primaryOffering
    ? primaryOffering.maxInvestmentPerAccountUsd || raiseTarget
    : 0;
  const raised = primaryOffering?.raisedUsd ?? 0;
  const percentRaised = raiseTarget > 0 ? Math.min(100, Math.round((raised / raiseTarget) * 100)) : 0;
  const valuation = primaryOffering?.valuationAtRaise || creator.valuation || raiseTarget;
  const uploadFrequency = creator.uploadFrequency || "2-3 uploads per month";
  const genre = creator.genre || creator.category;
  const subscriberHistory = analytics.subscriberHistory ?? fallbackSeries(creator.subscriberCount ?? 0, ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"], 0.82);
  const subscriberProjection = analytics.subscriberProjection ?? fallbackSeries(creator.subscriberCount ?? 0, ["Now", "+3m", "+6m", "+9m", "+12m"], 1, 1.18);
  const totalViewsHistory = analytics.totalViewsHistory ?? fallbackSeries(totalViews, ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"], 0.74);
  const artworkUrl = creator.artworkUrl || creator.avatarUrl;

  return (
    <div className="space-y-6">
      <section className="relative min-h-[340px] overflow-hidden rounded-[32px] bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
        <div className="absolute inset-0">
          {artworkUrl ? (
            <Image
              src={artworkUrl}
              alt={`${creator.name} artwork`}
              fill
              unoptimized
              sizes="(min-width: 1280px) 960px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#0d0f14,#1e293b_54%,#334155)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82),rgba(0,0,0,0.44)_56%,rgba(0,0,0,0.08))]" />
        </div>

        <div className="relative z-10 flex min-h-[340px] flex-col justify-end p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              {creator.avatarUrl ? (
                <Image
                  src={creator.avatarUrl}
                  alt={creator.name}
                  width={96}
                  height={96}
                  unoptimized
                  className="h-24 w-24 rounded-3xl border-4 border-white/90 object-cover shadow-[0_12px_34px_rgba(0,0,0,0.35)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white/90 bg-white text-3xl font-black text-slate-950 shadow-[0_12px_34px_rgba(0,0,0,0.35)]">
                  {creator.name[0]}
                </div>
              )}
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">{creator.name}</h1>
                  <span className="rounded-full border border-white/[0.15] bg-white/[0.12] px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                    {primaryOffering?.status === "active"
                      ? "Offering Live"
                      : primaryOffering?.status === "closed"
                        ? "Token Live"
                        : "Coming Soon"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.15] bg-white/[0.12] px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                    <Tag className="h-3 w-3" />
                    {genre}
                  </span>
                  {creator.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/[0.15] bg-white/[0.12] px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
                  <span>
                    <strong className="font-bold text-white">{formatNumber(creator.subscriberCount ?? 0)}</strong> subscribers
                  </span>
                  <span className="text-white/25">/</span>
                  <span>
                    <strong className="font-bold text-white">{formatNumber(totalViews)}</strong> total views
                  </span>
                  <span className="text-white/25">/</span>
                  <span>{uploadFrequency}</span>
                </div>
              </div>
            </div>
            {creator.youtubeUrl ? (
              <Button asChild variant="secondary" className="bg-white text-slate-950 hover:bg-white/90">
                <a href={creator.youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="h-4 w-4" />
                  Go to Channel
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <main className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: Users, label: "Subscribers", value: formatNumber(creator.subscriberCount ?? 0) },
              { icon: Eye, label: "Total Views", value: formatNumber(totalViews) },
              { icon: Upload, label: "Upload Frequency", value: uploadFrequency },
              { icon: Tag, label: "Genre", value: genre },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2 text-slate-400">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </div>
                <p className="text-lg font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <ChartPanel title="Subscriber Growth" icon={TrendingUp} data={subscriberHistory} tone="emerald" />
            <ChartPanel title="Future Projections" icon={LineChart} data={subscriberProjection} tone="lime" />
            <ChartPanel title="Total Views" icon={Eye} data={totalViewsHistory} tone="zinc" />
          </div>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Channel Bio</h2>
              <p className="mt-3 leading-7 text-slate-600">
                {creator.bio ||
                  `${creator.name} is a ${genre.toLowerCase()} creator with a large recurring audience and a channel built around repeatable, high-retention formats.`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Background</h2>
              <p className="mt-3 leading-7 text-slate-600">
                {creator.background ||
                  "Zeedly tracks audience growth, view velocity, upload cadence, and expected revenue share to present the creator as an investable offering."}
              </p>
            </div>
          </section>

          {completedOffering ? <RecentTrades creatorId={creator.creatorId} /> : null}
        </main>

        <aside className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">
                {primaryOffering?.status === "closed" ? "Token" : "Offering"}
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {primaryOffering?.dividendCadence ?? "Quarterly"} dividends
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-400">
                    {primaryOffering?.status === "closed" ? "Valuation Raised At" : "Valuation"}
                  </p>
                  <p className="mt-1 font-semibold text-zinc-900">{formatUsdt(valuation)}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-400">Amount Being Raised</p>
                  <p className="mt-1 font-semibold text-zinc-900">{formatUsdt(raiseTarget)}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-400">Max / Account</p>
                  <p className="mt-1 font-semibold text-zinc-900">{formatUsdt(accountMax)}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-400">Est. Monthly Payout</p>
                  <p className="mt-1 font-semibold text-emerald-600">{formatUsdt(estimatedMonthlyDividend)}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs text-zinc-400">Token Price</p>
                  <p className="mt-1 font-semibold text-zinc-900">
                    {formatUsdt(primaryOffering?.pricePerToken ?? currentPrice ?? 0, 2)}
                  </p>
                </div>
              </div>

              {primaryOffering ? (
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-500">{formatUsdt(raised)} raised</span>
                    <span className="text-zinc-400">{percentRaised}% funded</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-slate-950" style={{ width: `${percentRaised}%` }} />
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                    <CalendarClock className="h-4 w-4" />
                    {primaryOffering.status === "active"
                      ? `Ends ${formatDate(primaryOffering.endsAt)}`
                      : primaryOffering.status === "closed"
                        ? `Completed ${formatDate(primaryOffering.endsAt)}`
                        : `Starts ${formatDate(primaryOffering.startsAt)}`}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {activeOffering ? (
              <>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
                  <Rocket className="h-5 w-5 text-emerald-600" />
                  Live Offering
                </h3>
                <OfferingInvestForm
                  ipoId={activeOffering.ipoId}
                  pricePerToken={activeOffering.pricePerToken}
                  remaining={Math.min(
                    activeOffering.totalSupply - (activeOffering.sold ?? 0),
                    Math.floor(
                      Math.max(
                        0,
                        (activeOffering.raiseTargetUsd || activeOffering.totalSupply * activeOffering.pricePerToken) -
                          (activeOffering.raisedUsd ?? 0),
                      ) / activeOffering.pricePerToken,
                    ),
                  )}
                  remainingRaiseUsd={Math.max(
                    0,
                    (activeOffering.raiseTargetUsd || activeOffering.totalSupply * activeOffering.pricePerToken) -
                      (activeOffering.raisedUsd ?? 0),
                  )}
                  maxInvestmentPerAccountUsd={
                    activeOffering.maxInvestmentPerAccountUsd ||
                    activeOffering.raiseTargetUsd ||
                    activeOffering.totalSupply * activeOffering.pricePerToken
                  }
                  onSuccess={() => refetchIpos()}
                />
              </>
            ) : upcomingOffering ? (
              <div className="space-y-4 text-center">
                <ClockBadge />
                <div>
                  <p className="font-semibold text-zinc-900">Offering coming soon</p>
                  <p className="mt-1 text-sm text-zinc-500">Starts {formatDate(upcomingOffering.startsAt)}</p>
                </div>
                <Button
                  variant={notified ? "secondary" : "default"}
                  onClick={() => setNotified(true)}
                  className="w-full"
                >
                  <Bell className="h-4 w-4" />
                  {notified ? "Notification Set" : "Notify Me When Live"}
                </Button>
              </div>
            ) : currentPrice !== null ? (
              <>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
                  <ArrowRightLeft className="h-5 w-5 text-zinc-500" />
                  Buy Creator Token
                </h3>
                <TradeForm
                  creatorId={creator.creatorId}
                  creatorName={creator.name}
                  currentPrice={currentPrice}
                  onTraded={() => refetchPrice()}
                />
              </>
            ) : (
              <div className="py-6 text-center text-sm text-zinc-400">Trading is not available for this creator yet.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ClockBadge() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
      <CalendarClock className="h-6 w-6" />
    </div>
  );
}
