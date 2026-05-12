"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { LucideIcon } from "lucide-react";
import type { AppRouter } from "../../../../../api/src/trpc/router.js";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Bot,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Clock,
  Code2,
  Dumbbell,
  Eye,
  Flame,
  Gamepad2,
  Grid2X2,
  HeartPulse,
  Music2,
  Plane,
  Rocket,
  Search,
  Sparkles,
  Trophy,
  Users,
  Utensils,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Creator = RouterOutputs["creator"]["list"][number];
type Offering = RouterOutputs["ipo"]["list"][number];

const categoryIcons: Record<string, LucideIcon> = {
  all: Sparkles,
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

function timeUntil(ts: number) {
  const diff = ts - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return { value: days, unit: days === 1 ? "day" : "days" };
  const hours = Math.floor(diff / 3_600_000);
  if (hours >= 1) return { value: hours, unit: hours === 1 ? "hr" : "hrs" };
  const mins = Math.max(1, Math.floor(diff / 60_000));
  return { value: mins, unit: mins === 1 ? "min" : "mins" };
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
  if (status === "active") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (status === "closed") return "bg-slate-100 text-slate-600 border border-slate-200";
  return "bg-amber-50 text-amber-700 border border-amber-100";
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

function hashHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function LivePulse({ tone = "emerald" }: { tone?: "emerald" | "red" | "lime" }) {
  const dot = tone === "red" ? "bg-red-500" : tone === "lime" ? "bg-lime" : "bg-emerald-500";
  const ring =
    tone === "red" ? "bg-red-500/30" : tone === "lime" ? "bg-lime/40" : "bg-emerald-500/30";
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className={cn("absolute inset-0 animate-ping rounded-full", ring)} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", dot)} />
    </span>
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
  if (!src) {
    const hue = hashHue(creator?.name ?? "x");
    return (
      <div
        className={cn("bg-slate-900", className)}
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, hsl(${hue} 60% 30% / 0.6), transparent 60%), linear-gradient(135deg, #0d0f14, #1e293b 60%, #475569)`,
        }}
      />
    );
  }
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

function Avatar({
  creator,
  size = 72,
}: {
  creator: Creator | Offering["creator"] | null | undefined;
  size?: number;
}) {
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
  const hue = hashHue(creator?.name ?? "?");
  return (
    <div
      className="flex h-full w-full items-center justify-center text-lg font-black text-white"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 50% 25%), hsl(${(hue + 60) % 360} 60% 20%))`,
      }}
    >
      {creator?.name?.[0] ?? "?"}
    </div>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[12px] backdrop-blur-md">
      {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}
      <span className="text-slate-500">{label}</span>
      <span className="font-black tabular-nums text-slate-950">{value}</span>
    </div>
  );
}

function CategoryChip({
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
  const hue = hashHue(label);
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all",
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_8px_22px_rgba(15,23,42,0.18)]"
          : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          active ? "bg-white/15" : "bg-slate-50 group-hover:bg-slate-100",
        )}
        style={!active ? { color: `hsl(${hue} 50% 35%)` } : undefined}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums",
          active ? "bg-white/15 text-white/85" : "bg-slate-100 text-slate-500",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function CategoryStrip({
  categories,
  selected,
  onSelect,
}: {
  categories: { label: string; count: number }[];
  selected: string;
  onSelect: (label: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((c) => (
          <CategoryChip
            key={c.label}
            label={c.label}
            count={c.count}
            active={selected === c.label}
            onClick={() => onSelect(c.label)}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-20 bg-gradient-to-l from-[#f8fafc] via-[#f8fafc]/85 to-transparent sm:block" />
      <button
        onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
        aria-label="Scroll categories"
        className="pointer-events-auto absolute right-1 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-950 sm:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
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
  const target = offering ? getRaiseTarget(offering) : 0;
  const raised = offering?.raisedUsd ?? 0;
  const progress = offering ? getOfferingProgress(offering) : 0;
  const remaining = offering?.status === "active" ? timeUntil(offering.endsAt) : null;
  const valuation = offering
    ? offering.valuationAtRaise || creator.valuation || target
    : creator.valuation ?? 0;
  const href = creator.slug ? `/creator/${creator.slug}` : "/explore";

  return (
    <motion.section
      className="relative isolate overflow-hidden rounded-[32px] bg-slate-950 shadow-[0_28px_64px_-24px_rgba(15,23,42,0.45)]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="grid min-h-[420px] grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative h-[260px] overflow-hidden lg:h-auto">
          <CreatorImage
            creator={creator}
            className="transition-transform duration-700 hover:scale-[1.04]"
            sizes="(min-width: 1024px) 60vw, 100vw"
          />
          <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,transparent_55%,rgba(13,15,20,0.6)_85%,#0d0f14)] lg:block" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,15,20,0.05),rgba(13,15,20,0.65))] lg:hidden" />
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-lime" />
            Featured creator
          </div>
          {offering?.status === "active" ? (
            <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-950 backdrop-blur-md">
              <LivePulse tone="red" />
              Live raise
            </div>
          ) : null}
        </div>

        <div className="relative flex flex-col justify-between gap-8 p-6 text-white sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lime/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/15 shadow-xl">
                <Avatar creator={creator} size={56} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {creator.category}
                  {creator.genre ? ` · ${creator.genre}` : ""}
                </p>
                <h2 className="mt-0.5 truncate text-3xl font-black tracking-[-0.06em] sm:text-4xl">
                  {creator.name}
                </h2>
              </div>
            </div>
            <p className="max-w-md text-[14px] leading-6 text-white/70">
              {creator.bio ||
                `${creator.name} is a ${creator.category.toLowerCase()} creator with a growing recurring audience and monetized distribution.`}
            </p>
          </div>

          <div className="relative space-y-5">
            {offering ? (
              <div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-semibold text-white/65">
                    <span className="font-black text-white">{formatUsdt(raised)}</span>{" "}
                    raised of {formatUsdt(target)}
                  </span>
                  <span className="font-black text-lime">{progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-lime via-lime to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            ) : null}

            <dl className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5 text-[12px]">
              <HeroStat
                icon={Users}
                label="Subscribers"
                value={formatNumber(creator.subscriberCount ?? 0)}
              />
              <HeroStat
                icon={Eye}
                label="Avg views"
                value={formatNumber(creator.avgViews ?? 0)}
              />
              <HeroStat
                icon={Clock}
                label={remaining ? "Closes in" : "Valuation"}
                value={remaining ? `${remaining.value} ${remaining.unit}` : formatCurrency(valuation)}
              />
            </dl>

            <div className="flex flex-wrap gap-3">
              {offering?.status === "active" ? (
                <Button
                  onClick={() => onInvest(offering)}
                  className="bg-lime text-slate-950 shadow-[0_12px_30px_rgba(212,236,44,0.32)] hover:bg-lime-dark hover:text-slate-950"
                >
                  <Rocket className="h-4 w-4" />
                  Invest now
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={href}>
                  View profile <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="mt-1 truncate text-[18px] font-black tracking-[-0.03em] text-white">{value}</dd>
    </div>
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
  const remaining = timeUntil(offering.endsAt);
  const tokensLeft = Math.max(0, offering.totalSupply - (offering.sold ?? 0));

  return (
    <motion.div
      className="group relative overflow-hidden rounded-[22px] border border-slate-200/70 bg-white transition-all hover:-translate-y-1 hover:border-slate-200 hover:shadow-[0_20px_44px_-12px_rgba(15,23,42,0.18)]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <div className="relative h-[148px] overflow-hidden">
        <CreatorImage
          creator={creator}
          className="transition-transform duration-700 group-hover:scale-[1.06]"
          sizes="(min-width: 1280px) 33vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-950 backdrop-blur-md">
          <LivePulse tone="red" /> Live
        </div>
        {remaining ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-white backdrop-blur-md">
            <Clock className="h-3 w-3" />
            {remaining.value} {remaining.unit} left
          </div>
        ) : null}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-white/65">
              {creator?.category}
              {creator?.genre ? ` · ${creator.genre}` : ""}
            </p>
            <h3 className="mt-0.5 truncate text-[18px] font-black tracking-[-0.03em]">
              {creator?.name ?? "Unknown Creator"}
            </h3>
          </div>
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/95 shadow-lg">
            <Avatar creator={creator} size={48} />
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between text-[12px]">
            <span className="font-semibold text-slate-500">
              <span className="font-black tabular-nums text-slate-950">{formatUsdt(raised)}</span>{" "}
              of {formatUsdt(target)}
            </span>
            <span className="font-black tabular-nums text-emerald-600">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-[12px]">
          <Metric label="Token price" value={formatUsdt(offering.pricePerToken)} />
          <Metric label="Tokens left" value={formatNumber(tokensLeft)} />
          <Metric label="Subscribers" value={formatNumber(creator?.subscriberCount ?? 0)} />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {creator?.slug ? (
            <Link
              href={`/creator/${creator.slug}`}
              className="text-[12px] font-bold text-slate-500 transition-colors hover:text-slate-950"
            >
              View profile →
            </Link>
          ) : (
            <span />
          )}
          <Button onClick={() => onInvest(offering)} size="sm">
            <Rocket className="h-3.5 w-3.5" />
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
  const opensIn = timeUntil(offering.startsAt);
  const hue = hashHue(creator?.category ?? "");

  return (
    <div className="flex items-center gap-4 rounded-[18px] border border-slate-200/70 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_14px_32px_-12px_rgba(15,23,42,0.18)]">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-slate-200">
        <Avatar creator={creator} size={56} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-black tracking-[-0.02em] text-slate-950">
            {creator?.name ?? "Unknown Creator"}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
              statusTone(offering.status),
            )}
          >
            {offeringLabel(offering.status)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${hue} 60% 50%)` }} />
          <span className="truncate">{creator?.category ?? "Creator"}</span>
          <span className="text-slate-300">•</span>
          <span className="truncate">
            {isClosed
              ? `Closed ${formatDate(offering.endsAt)}`
              : opensIn
                ? `Opens in ${opensIn.value} ${opensIn.unit}`
                : `Opens ${formatDate(offering.startsAt)}`}
          </span>
        </div>
        {!isClosed ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-black tabular-nums text-slate-400">
              {formatUsdt(target)}
            </span>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-black text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> 100% funded
            </span>
            <span className="font-semibold text-slate-400">Raised {formatUsdt(target)}</span>
          </div>
        )}
      </div>

      {!isClosed ? (
        <Button variant={notified ? "secondary" : "outline"} size="sm" onClick={onNotify}>
          <Bell className="h-3.5 w-3.5" />
          {notified ? "Set" : "Notify"}
        </Button>
      ) : (
        <Button asChild size="sm">
          <Link href={creator?.slug ? `/creator/${creator.slug}` : "/explore"}>
            Trade <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function CreatorCard({ creator, index }: { creator: Creator; index: number }) {
  const hue = hashHue(creator.category);
  return (
    <motion.a
      href={`/creator/${creator.slug}`}
      className="group relative overflow-hidden rounded-[20px] border border-slate-200/70 bg-white transition-all hover:-translate-y-1 hover:border-slate-200 hover:shadow-[0_18px_40px_-14px_rgba(15,23,42,0.18)]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <div className="relative h-[128px] overflow-hidden bg-slate-900">
        <CreatorImage
          creator={creator}
          className="transition-transform duration-700 group-hover:scale-[1.06]"
          sizes="(min-width: 1280px) 25vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-950 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${hue} 60% 50%)` }} />
          {creator.category}
        </div>
      </div>
      <div className="p-4">
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <div className="h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-slate-950 shadow-sm">
            <Avatar creator={creator} size={56} />
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors group-hover:border-slate-950 group-hover:text-slate-950">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <h3 className="text-[15px] font-black tracking-[-0.03em] text-slate-950">{creator.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-[40px] text-[13px] leading-5 text-slate-500">
          {creator.bio ||
            `${creator.name} creates ${creator.category.toLowerCase()} content for a recurring audience.`}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          <Metric label="Subs" value={formatNumber(creator.subscriberCount ?? 0)} compact />
          <Metric label="Views" value={formatNumber(creator.avgViews ?? 0)} compact />
          <Metric label="Rev/mo" value={formatCurrency(creator.monthlyRevenue ?? 0)} compact accent />
        </div>
      </div>
    </motion.a>
  );
}

function Metric({
  label,
  value,
  compact,
  accent,
}: {
  label: string;
  value: string;
  compact?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p className={cn("text-slate-400", compact ? "text-[10px]" : "text-[11px]")}>{label}</p>
      <p
        className={cn(
          "font-black tracking-[-0.02em] text-slate-950 tabular-nums",
          compact ? "text-[12px]" : "text-[14px]",
          accent && "text-emerald-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InvestmentModal({
  offering,
  onClose,
  onSuccess,
}: {
  offering: Offering;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
  const ceiling = Math.min(
    remaining * offering.pricePerToken,
    remainingRaiseUsd,
    accountMax,
    Math.max(0, available),
  );

  const quickAmounts = [25, 100, 500, 1000].filter((a, i) => i === 0 || a <= ceiling);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_64px_-16px_rgba(15,23,42,0.35)]"
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-slate-950 px-6 pb-5 pt-6 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lime/15 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                Invest in
              </p>
              <h2 className="mt-1 truncate text-xl font-black tracking-[-0.04em]">
                {offering.creator?.name}
              </h2>
              <p className="mt-1 text-[12px] text-white/55">{offering.creator?.category}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 flex items-baseline justify-between text-[12px]">
              <span className="font-semibold text-slate-600">Amount to lock</span>
              <span className="font-bold text-slate-400">Available {formatUsdt(available)}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={offering.pricePerToken}
                max={ceiling}
                step="1"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 pr-16 text-[20px] font-black tabular-nums text-slate-950 transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                USDT
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmountStr(String(a))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 hover:border-slate-950 hover:text-slate-950"
                >
                  {a}
                </button>
              ))}
              {ceiling > 0 ? (
                <button
                  onClick={() => setAmountStr(String(Math.floor(ceiling)))}
                  className="rounded-full border border-slate-950 bg-slate-950 px-3 py-1 text-[11px] font-bold text-white"
                >
                  Max
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[13px]">
            <Row label="Estimated tokens" value={quantity.toLocaleString()} />
            <Row label="USDT to lock" value={formatUsdt(spend)} />
            <Row label="Token price" value={formatUsdt(offering.pricePerToken)} muted />
            <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500">
              Funds are frozen until the raise closes. KYC is required before tokens are released.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={purchase.isPending || quantity < 1}
              className="flex-1"
            >
              {purchase.isPending ? "Locking..." : "Lock pledge"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="mt-2 flex items-center justify-between first:mt-0">
      <span className="text-slate-500">{label}</span>
      <span className={cn("font-black tabular-nums", muted ? "text-slate-500" : "text-slate-950")}>
        {value}
      </span>
    </div>
  );
}

function SectionHeading({
  title,
  count,
  tone,
}: {
  title: string;
  count?: number;
  tone?: "live" | "upcoming" | "completed";
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-[22px] font-black tracking-[-0.04em] text-slate-950">{title}</h2>
        {tone === "live" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-red-600">
            <LivePulse tone="red" /> Live
          </span>
        ) : null}
        {tone === "upcoming" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">
            <Clock className="h-3 w-3" /> Upcoming
          </span>
        ) : null}
        {tone === "completed" ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-100 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
            <CheckCircle2 className="h-3 w-3" /> Closed
          </span>
        ) : null}
      </div>
      {typeof count === "number" ? (
        <span className="text-[12px] font-bold text-slate-400">
          {count} {count === 1 ? "item" : "items"}
        </span>
      ) : null}
    </div>
  );
}

function EmptyState({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-dashed border-slate-200 bg-white/60 text-center text-sm font-medium text-slate-400",
        compact ? "px-4 py-8" : "px-6 py-14",
      )}
    >
      {message}
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
  const selectedOffering = offerings?.find((o) => o.ipoId === selectedOfferingId);

  const allCreators = useMemo(() => creators ?? [], [creators]);
  const allOfferings = useMemo(() => offerings ?? [], [offerings]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of allCreators) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    return [
      { label: "All", count: allCreators.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([label, count]) => ({ label, count })),
    ];
  }, [allCreators]);

  const filteredCreators = allCreators.filter((creator) => {
    const matchesCategory = selectedCategory === "All" || creator.category === selectedCategory;
    return matchesCategory && matchesSearch(creator, search);
  });

  const filteredOfferings = allOfferings.filter((o) => {
    const matchesCategory = selectedCategory === "All" || o.creator?.category === selectedCategory;
    return matchesCategory && matchesSearch(o.creator, search);
  });

  const liveOfferings = filteredOfferings.filter((o) => o.status === "active");
  const upcomingOfferings = filteredOfferings.filter((o) => o.status === "upcoming");
  const completedOfferings = filteredOfferings.filter((o) => o.status === "closed");
  const featuredOffering = liveOfferings[0] ?? filteredOfferings[0];
  const featuredCreator = featuredOffering?.creator ?? filteredCreators[0];
  const isLoading = isLoadingCreators || isLoadingOfferings;

  const totalRaised = allOfferings.reduce((s, o) => s + (o.raisedUsd ?? 0), 0);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(60%_60%_at_50%_0%,rgba(212,236,44,0.10),transparent_70%)]" />
        <div className="absolute -top-20 right-1/3 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-3xl" />
        <div className="absolute -top-10 left-1/4 h-64 w-64 rounded-full bg-fuchsia-400/[0.07] blur-3xl" />
      </div>

      <div className="space-y-9 pb-12">
        <motion.header
          className="flex flex-col gap-5 sm:gap-7"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              Creator market
              <span className="text-slate-300">·</span>
              <span>{allCreators.length} creators</span>
              <span className="text-slate-300">·</span>
              <span>{liveOfferings.length} live raises</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 shadow-sm backdrop-blur-md sm:w-72">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search creators, tags..."
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-950 outline-none placeholder:text-slate-400"
                />
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="rounded-full p-0.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-950"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline-block">
                    ⌘K
                  </kbd>
                )}
              </div>
              <Button asChild>
                <Link href="/wallet">
                  <Wallet className="h-4 w-4" />
                  Deposit
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-[40px] font-black leading-[1.02] tracking-[-0.07em] text-slate-950 sm:text-[56px]">
                Invest in tomorrow&apos;s <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-slate-950 via-slate-700 to-slate-500 bg-clip-text text-transparent">
                  creator economy.
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
                Back independent creators at their earliest stage, earn dividends from their work,
                and trade their tokens onchain — without leaving USD.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatPill icon={Flame} label="Total raised" value={formatCurrency(totalRaised)} />
              <StatPill icon={Users} label="Creators" value={String(allCreators.length)} />
              <StatPill icon={Zap} label="Live" value={String(liveOfferings.length)} />
            </div>
          </div>
        </motion.header>

        <section>
          <CategoryStrip
            categories={categoryCounts}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </section>

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-[420px] animate-pulse rounded-[32px] bg-slate-100" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-[22px] bg-slate-100" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <FeaturedHero
              creator={featuredCreator}
              offering={featuredOffering}
              onInvest={(o) => setSelectedOfferingId(o.ipoId)}
            />

            <section>
              <SectionHeading title="Live raises" count={liveOfferings.length} tone="live" />
              {liveOfferings.length === 0 ? (
                <EmptyState message="No live raises match this filter." />
              ) : (
                <div
                  className={cn(
                    "grid gap-4",
                    liveOfferings.length === 1
                      ? "grid-cols-1 md:max-w-md"
                      : liveOfferings.length === 2
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
                  )}
                >
                  {liveOfferings.map((o, i) => (
                    <LiveOfferingCard
                      key={o.ipoId}
                      offering={o}
                      index={i}
                      onInvest={(item) => setSelectedOfferingId(item.ipoId)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div>
                <SectionHeading
                  title="Opening soon"
                  count={upcomingOfferings.length}
                  tone="upcoming"
                />
                <div className="space-y-3">
                  {upcomingOfferings.length ? (
                    upcomingOfferings.map((o) => (
                      <CompactOfferingCard
                        key={o.ipoId}
                        offering={o}
                        notified={notified.has(o.ipoId)}
                        onNotify={() =>
                          setNotified((cur) => {
                            const next = new Set(cur);
                            next.add(o.ipoId);
                            return next;
                          })
                        }
                      />
                    ))
                  ) : (
                    <EmptyState message="No upcoming raises match this filter." compact />
                  )}
                </div>
              </div>
              <div>
                <SectionHeading
                  title="Recently funded"
                  count={completedOfferings.length}
                  tone="completed"
                />
                <div className="space-y-3">
                  {completedOfferings.length ? (
                    completedOfferings.map((o) => (
                      <CompactOfferingCard
                        key={o.ipoId}
                        offering={o}
                        notified={false}
                        onNotify={() => undefined}
                      />
                    ))
                  ) : (
                    <EmptyState message="No completed raises match this filter." compact />
                  )}
                </div>
              </div>
            </section>

            <section>
              <SectionHeading title="All creators" count={filteredCreators.length} />
              {filteredCreators.length === 0 ? (
                <EmptyState message="No creators match this filter." />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {filteredCreators.map((c, i) => (
                    <CreatorCard key={c.creatorId} creator={c} index={i} />
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
    </div>
  );
}
