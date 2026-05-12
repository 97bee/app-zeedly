"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { LucideIcon } from "lucide-react";
import type { AppRouter } from "../../../../../api/src/trpc/router.js";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Bot,
  Camera,
  CircleDollarSign,
  Clapperboard,
  Code2,
  Dumbbell,
  ExternalLink,
  Gamepad2,
  Grid2X2,
  HeartPulse,
  Music2,
  Plane,
  Plus,
  Rocket,
  Search,
  Trophy,
  Utensils,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Creator = RouterOutputs["creator"]["list"][number];
type Offering = RouterOutputs["ipo"]["list"][number];

const categoryIcons: Record<string, LucideIcon> = {
  all: Grid2X2,
  gaming: Gamepad2,
  "ai / tech": Bot,
  tech: Code2,
  finance: CircleDollarSign,
  entertainment: Clapperboard,
  fitness: HeartPulse,
  music: Music2,
  food: Utensils,
  travel: Plane,
  photography: Camera,
  sports: Trophy,
  dance: Dumbbell,
};

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCurrency(amount: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(amount);
}

function formatUsdt(amount: number): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)} USDT`;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(ts));
}

function getRaiseTarget(offering: Offering) {
  return offering.raiseTargetUsd || offering.totalSupply * offering.pricePerToken;
}

function getAccountMax(offering: Offering) {
  return offering.maxInvestmentPerAccountUsd || getRaiseTarget(offering);
}

function offeringLabel(status?: string) {
  if (status === "active") return "Live";
  if (status === "closed") return "Completed";
  return "Coming soon";
}

function statusTone(status?: string) {
  if (status === "active") return "bg-red-50 text-red-600";
  if (status === "closed") return "bg-slate-100 text-slate-500";
  return "bg-amber-50 text-amber-700";
}

function getCreatorKey(creator: Creator | Offering["creator"] | null | undefined) {
  return [creator?.name, creator?.category, creator?.genre, creator?.tags?.join(" ")].join(" ").toLowerCase();
}

function matchesSearch(creator: Creator | Offering["creator"] | null | undefined, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return getCreatorKey(creator).includes(query);
}

function getOfferingProgress(offering: Offering) {
  const target = getRaiseTarget(offering);
  const raised = offering.raisedUsd ?? 0;
  return target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
}

interface InvestmentModalProps {
  offering: Offering;
  onClose: () => void;
  onSuccess: () => void;
}

function InvestmentModal({ offering, onClose, onSuccess }: InvestmentModalProps) {
  const [amountStr, setAmountStr] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const purchase = trpc.ipo.purchase.useMutation();
  const { data: balance } = trpc.wallet.balance.useQuery();
  const raiseTarget = getRaiseTarget(offering);
  const accountMax = getAccountMax(offering);
  const raised = offering.raisedUsd ?? 0;
  const remainingRaiseUsd = Math.max(0, raiseTarget - raised);
  const amount = Number.parseFloat(amountStr) || 0;
  const quantity = Math.floor(amount / offering.pricePerToken);
  const remaining = Math.min(
    offering.totalSupply - (offering.sold ?? 0),
    Math.floor(remainingRaiseUsd / offering.pricePerToken),
  );
  const spend = quantity * offering.pricePerToken;
  const available = balance?.usdtBalance ?? balance?.usdcBalance ?? 0;

  async function handleSubmit() {
    if (quantity < 1) {
      setError("Enter enough USDT to buy at least 1 token");
      return;
    }
    if (quantity > remaining) {
      setError("That is more than the remaining allocation");
      return;
    }
    if (spend > remainingRaiseUsd) {
      setError("That is more than the remaining raise target");
      return;
    }
    if (spend > accountMax) {
      setError(`Max investment for this offering is ${formatUsdt(accountMax)}`);
      return;
    }
    if (spend > available) {
      setError("Insufficient USDT balance");
      return;
    }

    setError(null);
    try {
      await purchase.mutateAsync({ ipoId: offering.ipoId, quantity });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investment failed");
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Invest in {offering.creator?.name}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-950">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm text-slate-500">Lock from available USDT balance</label>
            <input
              type="number"
              min={offering.pricePerToken}
              max={Math.min(remaining * offering.pricePerToken, remainingRaiseUsd, accountMax)}
              step="1"
              value={amountStr}
              onChange={(event) => setAmountStr(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-950 placeholder-slate-400 transition-all focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10"
            />
            <p className="mt-1 text-xs text-slate-400">
              Available: {formatUsdt(available)} / {formatUsdt(remainingRaiseUsd)} left / Max {formatUsdt(accountMax)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated tokens</span>
              <span className="font-medium text-slate-950">{quantity.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-slate-500">USDT to lock</span>
              <span className="font-medium text-slate-950">{formatUsdt(spend)}</span>
            </div>
            <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
              This pledge is frozen until the offering completes. KYC is required before token claim.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={purchase.isPending || quantity < 1} className="flex-1">
              {purchase.isPending ? "Locking..." : "Lock pledge"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreatorImage({
  creator,
  className,
  sizes,
}: {
  creator: Creator | Offering["creator"] | null | undefined;
  className: string;
  sizes: string;
}) {
  const src = creator?.artworkUrl || creator?.avatarUrl;
  if (!src) return <div className={cn("bg-[linear-gradient(135deg,#0d0f14,#263244_55%,#7c8795)]", className)} />;

  return (
    <Image
      src={src}
      alt={`${creator?.name ?? "Creator"} artwork`}
      fill
      unoptimized
      sizes={sizes}
      className={cn("object-cover", className)}
    />
  );
}

function Avatar({ creator, size = 72 }: { creator: Creator | Offering["creator"] | null | undefined; size?: number }) {
  if (creator?.avatarUrl) {
    return (
      <Image
        src={creator.avatarUrl}
        alt={creator.name}
        width={size}
        height={size}
        unoptimized
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-lg font-black text-white">
      {creator?.name?.[0] ?? "?"}
    </div>
  );
}

function CategoryCard({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = categoryIcons[label.toLowerCase()] ?? Grid2X2;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]",
        active ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:text-slate-950",
      )}
    >
      <Icon className={cn("h-6 w-6", active ? "text-slate-950" : "text-slate-500")} />
      <span className="text-[12px] font-bold">{label}</span>
      <span className="text-[11px] text-slate-400">{count} creators</span>
    </button>
  );
}

function FeaturedHero({
  creator,
  offering,
  onInvest,
}: {
  creator: Creator | Offering["creator"] | null | undefined;
  offering?: Offering;
  onInvest: (offering: Offering) => void;
}) {
  if (!creator) return null;

  const valuation = offering ? offering.valuationAtRaise || creator.valuation || getRaiseTarget(offering) : creator.valuation ?? 0;
  const href = creator.slug ? `/creator/${creator.slug}` : "/explore";

  return (
    <motion.section
      className="group relative min-h-[360px] overflow-hidden rounded-[28px] bg-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <CreatorImage
        creator={creator}
        className="transition-transform duration-700 group-hover:scale-105"
        sizes="(min-width: 1024px) 1100px, 100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.84),rgba(3,7,18,0.38)_58%,rgba(3,7,18,0.12))]" />
      <div className="absolute left-5 top-5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-md">
        Featured Creator
      </div>
      <div className="relative flex min-h-[360px] max-w-2xl flex-col justify-end p-6 sm:p-8">
        <div className="mb-5 flex h-20 w-20 overflow-hidden rounded-full border-[3px] border-white shadow-xl">
          <Avatar creator={creator} />
        </div>
        <h2 className="text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">{creator.name}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/76">
          {creator.bio ||
            `${creator.name} is a ${creator.category.toLowerCase()} creator with a growing recurring audience and monetized distribution.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md">
            {formatNumber(creator.subscriberCount ?? 0)} subscribers
          </span>
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md">
            Valuation {formatCurrency(valuation)}
          </span>
          {offering ? (
            <span className="rounded-full bg-red-500/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur-md">
              {offeringLabel(offering.status)}
            </span>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {offering?.status === "active" ? (
            <Button onClick={() => onInvest(offering)} className="bg-white text-slate-950 shadow-none hover:bg-slate-100">
              <Rocket className="h-4 w-4" />
              Invest now
            </Button>
          ) : null}
          <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white">
            <Link href={href}>
              View profile <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

function LiveOfferingCard({
  offering,
  index,
  onInvest,
}: {
  offering: Offering;
  index: number;
  onInvest: (offering: Offering) => void;
}) {
  const creator = offering.creator;
  const target = getRaiseTarget(offering);
  const raised = offering.raisedUsd ?? 0;
  const progress = getOfferingProgress(offering);

  return (
    <motion.div
      className="group rounded-[18px] bg-white transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <div className="relative h-[116px] rounded-t-[18px] bg-slate-900">
        <CreatorImage creator={creator} className="rounded-t-[18px]" sizes="(min-width: 1280px) 33vw, 100vw" />
        <div className="absolute inset-0 rounded-t-[18px] bg-gradient-to-t from-black/30 to-black/5" />
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-red-600">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Live
        </div>
        <div className="absolute -bottom-8 left-5 h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white bg-slate-950">
          <Avatar creator={creator} />
        </div>
      </div>

      <div className="px-5 pb-5 pt-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-black tracking-[-0.03em] text-slate-950">
              {creator?.name ?? "Unknown Creator"}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-400">{creator?.genre ?? creator?.category ?? "Creator"}</p>
          </div>
          {creator?.youtubeUrl ? (
            <a
              href={creator.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-950"
              title="Open creator channel"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric label="Subscribers" value={formatNumber(creator?.subscriberCount ?? 0)} />
          <Metric label="Avg views" value={formatNumber(creator?.avgViews ?? 0)} />
          <Metric label="Price" value={formatUsdt(offering.pricePerToken)} />
        </div>

        <div className="mt-4">
          <div className="mb-2 flex justify-between text-xs">
            <span className="font-semibold text-slate-500">{formatUsdt(raised)} raised</span>
            <span className="font-semibold text-slate-400">{progress}% funded</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-950" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] text-slate-400">Target</p>
            <p className="text-sm font-bold text-slate-950">{formatUsdt(target)}</p>
          </div>
          <Button onClick={() => onInvest(offering)} size="sm">
            <Rocket className="h-4 w-4" />
            Invest
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function CompactOfferingCard({
  offering,
  notified,
  onNotify,
}: {
  offering: Offering;
  notified: boolean;
  onNotify: () => void;
}) {
  const creator = offering.creator;
  const target = getRaiseTarget(offering);
  const progress = getOfferingProgress(offering);
  const isClosed = offering.status === "closed";

  return (
    <div className="rounded-[18px] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-950">
          <Avatar creator={creator} size={48} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black tracking-[-0.02em] text-slate-950">
                {creator?.name ?? "Unknown Creator"}
              </h3>
              <p className="mt-0.5 truncate text-xs text-slate-400">{creator?.category ?? "Creator"}</p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold", statusTone(offering.status))}>
              {offeringLabel(offering.status)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Metric label="Target" value={formatUsdt(target)} compact />
            <Metric label="Funded" value={`${progress}%`} compact />
            <Metric label={isClosed ? "Completed" : "Starts"} value={formatDate(isClosed ? offering.endsAt : offering.startsAt)} compact />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        {creator?.slug ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/creator/${creator.slug}`}>Details</Link>
          </Button>
        ) : <span />}
        {!isClosed ? (
          <Button variant={notified ? "secondary" : "default"} size="sm" onClick={onNotify}>
            <Bell className="h-4 w-4" />
            {notified ? "Set" : "Notify"}
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href={creator?.slug ? `/creator/${creator.slug}` : "/explore"}>
              Buy <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function CreatorCard({ creator, index }: { creator: Creator; index: number }) {
  return (
    <motion.a
      href={`/creator/${creator.slug}`}
      className="group overflow-hidden rounded-[18px] bg-white transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <div className="relative h-32 bg-slate-900">
        <CreatorImage creator={creator} className="transition-transform duration-500 group-hover:scale-105" sizes="(min-width: 1280px) 25vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-3 left-3 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
          {creator.category}
        </div>
      </div>
      <div className="p-4">
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <div className="h-16 w-16 overflow-hidden rounded-full border-[3px] border-white bg-slate-950 shadow-sm">
            <Avatar creator={creator} size={64} />
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors group-hover:border-slate-950 group-hover:text-slate-950">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <h3 className="text-base font-black tracking-[-0.03em] text-slate-950">{creator.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">
          {creator.bio || `${creator.name} creates ${creator.category.toLowerCase()} content for a recurring audience.`}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          <Metric label="Subs" value={formatNumber(creator.subscriberCount ?? 0)} compact />
          <Metric label="Views" value={formatNumber(creator.avgViews ?? 0)} compact />
          <Metric label="Revenue" value={formatCurrency(creator.monthlyRevenue ?? 0)} compact accent />
        </div>
      </div>
    </motion.a>
  );
}

function Metric({ label, value, compact, accent }: { label: string; value: string; compact?: boolean; accent?: boolean }) {
  return (
    <div>
      <p className={cn("text-slate-400", compact ? "text-[10px]" : "text-[11px]")}>{label}</p>
      <p className={cn("font-bold text-slate-950", compact ? "text-xs" : "text-sm", accent && "text-emerald-600")}>{value}</p>
    </div>
  );
}

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());
  const { data: creators, isLoading: isLoadingCreators } = trpc.creator.list.useQuery();
  const { data: offerings, isLoading: isLoadingOfferings, refetch } = trpc.ipo.list.useQuery();
  const selectedOffering = offerings?.find((offering) => offering.ipoId === selectedOfferingId);

  const allCreators = useMemo(() => creators ?? [], [creators]);
  const allOfferings = useMemo(() => offerings ?? [], [offerings]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const creator of allCreators) {
      counts.set(creator.category, (counts.get(creator.category) ?? 0) + 1);
    }
    return [
      { label: "All", count: allCreators.length },
      ...[...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count })),
    ];
  }, [allCreators]);

  const filteredCreators = allCreators.filter((creator) => {
    const matchesCategory = selectedCategory === "All" || creator.category === selectedCategory;
    return matchesCategory && matchesSearch(creator, search);
  });

  const filteredOfferings = allOfferings.filter((offering) => {
    const creator = offering.creator;
    const matchesCategory = selectedCategory === "All" || creator?.category === selectedCategory;
    return matchesCategory && matchesSearch(creator, search);
  });

  const liveOfferings = filteredOfferings.filter((offering) => offering.status === "active");
  const upcomingOfferings = filteredOfferings.filter((offering) => offering.status === "upcoming");
  const completedOfferings = filteredOfferings.filter((offering) => offering.status === "closed");
  const featuredOffering = liveOfferings[0] ?? filteredOfferings[0];
  const featuredCreator = featuredOffering?.creator ?? filteredCreators[0];
  const isLoading = isLoadingCreators || isLoadingOfferings;

  return (
    <div className="space-y-8 pb-8">
      <motion.div
        className="flex flex-col gap-4 rounded-[24px] bg-[#f8fafc]/90 py-2 sm:flex-row sm:items-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h1 className="text-[28px] font-black tracking-[-0.06em] text-slate-950">Creator Market</h1>
          <p className="mt-1 text-sm text-slate-500">Discover creators, live raises, and completed creator tokens in one place.</p>
        </div>
        <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center">
          <div className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 shadow-sm sm:w-64">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search creators..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
          <Button asChild>
            <Link href="/wallet">
              Deposit <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-black tracking-[-0.03em] text-slate-950">Browse Categories</h2>
          <span className="text-xs font-semibold text-slate-400">{filteredCreators.length} creators shown</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">
          {categoryCounts.map((category) => (
            <CategoryCard
              key={category.label}
              label={category.label}
              count={category.count}
              active={selectedCategory === category.label}
              onClick={() => setSelectedCategory(category.label)}
            />
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-5">
          <div className="h-[360px] animate-pulse rounded-[28px] bg-slate-100" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-[18px] bg-slate-100" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <FeaturedHero
            creator={featuredCreator}
            offering={featuredOffering}
            onInvest={(offering) => setSelectedOfferingId(offering.ipoId)}
          />

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[22px] font-black tracking-[-0.04em] text-slate-950">Live Offerings</h2>
                <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-red-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  Live
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-400">{liveOfferings.length} open</span>
            </div>
            {liveOfferings.length === 0 ? (
              <EmptyState message="No live offerings match this filter." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {liveOfferings.map((offering, index) => (
                  <LiveOfferingCard
                    key={offering.ipoId}
                    offering={offering}
                    index={index}
                    onInvest={(item) => setSelectedOfferingId(item.ipoId)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div>
              <SectionHeading title="Coming Soon" count={upcomingOfferings.length} />
              <div className="space-y-3">
                {upcomingOfferings.length ? (
                  upcomingOfferings.map((offering) => (
                    <CompactOfferingCard
                      key={offering.ipoId}
                      offering={offering}
                      notified={notified.has(offering.ipoId)}
                      onNotify={() => setNotified((current) => new Set(current).add(offering.ipoId))}
                    />
                  ))
                ) : (
                  <EmptyState message="No upcoming offerings match this filter." compact />
                )}
              </div>
            </div>
            <div>
              <SectionHeading title="Completed" count={completedOfferings.length} />
              <div className="space-y-3">
                {completedOfferings.length ? (
                  completedOfferings.map((offering) => (
                    <CompactOfferingCard
                      key={offering.ipoId}
                      offering={offering}
                      notified={false}
                      onNotify={() => undefined}
                    />
                  ))
                ) : (
                  <EmptyState message="No completed offerings match this filter." compact />
                )}
              </div>
            </div>
          </section>

          <section>
            <SectionHeading title="All Creators" count={filteredCreators.length} />
            {filteredCreators.length === 0 ? (
              <EmptyState message="No creators match this filter." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {filteredCreators.map((creator, index) => (
                  <CreatorCard key={creator.creatorId} creator={creator} index={index} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <AnimatePresence>
        {selectedOffering && selectedOffering.status === "active" ? (
          <InvestmentModal
            offering={selectedOffering}
            onClose={() => setSelectedOfferingId(null)}
            onSuccess={() => {
              setSelectedOfferingId(null);
              refetch();
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[22px] font-black tracking-[-0.04em] text-slate-950">{title}</h2>
      <span className="text-sm font-semibold text-slate-400">{count} items</span>
    </div>
  );
}

function EmptyState({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-dashed border-slate-200 bg-white text-center text-sm font-medium text-slate-400",
        compact ? "px-4 py-8" : "px-6 py-14",
      )}
    >
      {message}
    </div>
  );
}
