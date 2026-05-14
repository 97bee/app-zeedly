"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { inferRouterOutputs } from "@trpc/server";
import { ArrowDownRight, ArrowUpRight, Star } from "lucide-react";
import type { AppRouter } from "../../../../../api/src/trpc/router.js";
import { cn } from "@/lib/utils";
import { useIpos } from "@/features/ipo/hooks/useIpos";
import { useCreators } from "@/features/creator/hooks/useCreators";
import { usePortfolioHoldings } from "@/features/portfolio/hooks/usePortfolioHoldings";
import { useTradePrice } from "@/features/trade/hooks/useTradePrice";
import { useTradePriceHistory } from "@/features/trade/hooks/useTradePriceHistory";
import { useWatchlist } from "@/features/watchlist/hooks/useWatchlist";
import { Sparkline } from "@/components/ui/sparkline";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Offering = RouterOutputs["ipo"]["list"][number];
type Creator = RouterOutputs["creator"]["list"][number];
type CreatorMaybe = Offering["creator"] | Creator | null | undefined;

type TabKey = "tradable" | "upcoming" | "watchlist";

const TABS: Array<{ key: TabKey; label: string; folio: string }> = [
  { key: "tradable", label: "Tradable", folio: "01" },
  { key: "upcoming", label: "Upcoming", folio: "02" },
  { key: "watchlist", label: "Watchlist", folio: "03" },
];

// Subtle paper grain — multiplied on the light surface, screened on dark.
// Inline SVG so we ship no images for it.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.32 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

function fmt(amount: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(amount);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function hashHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function deriveTicker(creator: CreatorMaybe) {
  return (creator?.slug ?? creator?.name ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
}

function Avatar({ creator, size = 44 }: { creator: CreatorMaybe; size?: number }) {
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
      className="flex h-full w-full items-center justify-center font-serif text-base italic text-white"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 28% 22%), hsl(${
          (hue + 50) % 360
        } 30% 16%))`,
      }}
    >
      {creator?.name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── Masthead ─────────────────────────────────────────────────────────────
function Masthead() {
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
        .format(new Date())
        .toUpperCase(),
    [],
  );
  const issueNo = useMemo(() => {
    // Day of the year — gives the masthead a folio that ticks daily.
    const start = Date.UTC(new Date().getUTCFullYear(), 0, 0);
    return Math.floor((Date.now() - start) / 86_400_000);
  }, []);

  return (
    <div className="border-b-[3px] border-double border-stone-900 px-5 py-3 dark:border-stone-200 sm:px-7">
      <div className="flex items-baseline justify-between gap-4">
        <p className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 sm:block">
          {dateLabel}
        </p>
        <h1 className="font-serif text-[22px] italic leading-none tracking-tight text-stone-900 dark:text-stone-100 sm:text-[26px]">
          Zeedly Daily
          <span className="ml-2 inline-block translate-y-[-2px] align-middle text-stone-400">
            ❦
          </span>
        </h1>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] tabular-nums text-stone-500">
          Vol. 01 · № {pad2(issueNo)}
        </p>
      </div>
    </div>
  );
}

// ── Standing hero ────────────────────────────────────────────────────────
function StandingHero({
  totalValue,
  change24hValue,
  change24hPct,
}: {
  totalValue: number;
  change24hValue: number | null;
  change24hPct: number | null;
}) {
  const hasChange = change24hValue !== null && change24hPct !== null;
  const positive = (change24hValue ?? 0) >= 0;
  return (
    <section className="grid grid-cols-12 gap-x-6 px-5 pb-10 pt-12 sm:px-7 sm:pt-14">
      {/* Left: the giant italic number */}
      <div className="col-span-12 lg:col-span-8">
        <p className="font-serif text-base italic text-stone-500 dark:text-stone-400">
          Your standing,{" "}
          <span className="text-stone-700 dark:text-stone-300">today.</span>
        </p>
        <h2 className="mt-2 select-none font-serif text-[clamp(72px,11vw,144px)] italic leading-[0.88] tracking-[-0.04em] text-stone-900 dark:text-stone-100">
          ${fmt(totalValue)}
        </h2>
        <div className="mt-3 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.2em]">
          <span className="text-stone-500">Total portfolio</span>
          <span className="h-px w-6 self-center bg-stone-300 dark:bg-stone-700" />
          <span className="text-stone-700 dark:text-stone-300">USDT</span>
        </div>
      </div>

      {/* Right: byline-style metadata */}
      <div className="col-span-12 mt-8 flex flex-row gap-8 lg:col-span-4 lg:mt-0 lg:flex-col lg:items-end lg:justify-end lg:gap-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            Last 24 hrs
          </p>
          {hasChange ? (
            <p
              className={cn(
                "mt-1 flex items-baseline gap-1 font-serif text-3xl italic tabular-nums",
                positive
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400",
              )}
            >
              {positive ? "+" : "−"}${fmt(Math.abs(change24hValue ?? 0))}
              {positive ? (
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <ArrowDownRight className="h-4 w-4" strokeWidth={1.5} />
              )}
            </p>
          ) : (
            <p className="mt-1 font-serif text-3xl italic text-stone-400 dark:text-stone-700">
              —
            </p>
          )}
        </div>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            Rate of return
          </p>
          {hasChange ? (
            <p
              className={cn(
                "mt-1 font-serif text-3xl italic tabular-nums",
                positive
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400",
              )}
            >
              {positive ? "+" : ""}
              {(change24hPct ?? 0).toFixed(2)}%
            </p>
          ) : (
            <p className="mt-1 font-serif text-3xl italic text-stone-400 dark:text-stone-700">
              —
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Capital panel: Investments wide + Cash/Locked as marginalia ──────────
function CapitalPanel({
  invested,
  costBasis,
  cash,
  locked,
}: {
  invested: number;
  costBasis: number;
  cash: number;
  locked: number;
}) {
  return (
    <section className="grid grid-cols-12 border-y border-stone-300 dark:border-stone-800">
      {/* Investments — bleeds wide, with a thin chart */}
      <div className="col-span-12 px-5 py-6 sm:px-7 lg:col-span-8 lg:border-r lg:border-stone-300 lg:pr-8 lg:dark:border-stone-800">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              I.
            </span>
            <h3 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100">
              Investments
            </h3>
          </div>
          <p className="font-mono text-[13px] tabular-nums text-stone-700 dark:text-stone-300">
            ${fmt(invested)}{" "}
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
              USDT
            </span>
          </p>
        </div>
        <div className="mt-5 h-24 text-emerald-700 dark:text-emerald-400/80">
          <Sparkline
            points={invested > 0 ? [costBasis || invested, invested] : [1, 1]}
            tone={invested >= costBasis ? "positive" : "negative"}
            showFill
            strokeWidth={1.4}
          />
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-stone-400 dark:text-stone-600">
          <span>Open</span>
          <span className="h-px flex-1 mx-3 bg-stone-200 dark:bg-stone-800" />
          <span>Now</span>
        </div>
      </div>

      {/* Marginalia stack */}
      <div className="col-span-12 grid grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-2">
        <Marginalia
          label="II. Cash on hand"
          value={cash}
          decoration="—"
          className="border-t border-stone-300 dark:border-stone-800 lg:border-t-0"
        />
        <Marginalia
          label="III. Locked"
          value={locked}
          decoration="✕"
          className="border-l border-stone-300 dark:border-stone-800 lg:border-l-0 lg:border-t"
        />
      </div>
    </section>
  );
}

function Marginalia({
  label,
  value,
  decoration,
  className,
}: {
  label: string;
  value: number;
  decoration: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-5 py-5 sm:px-7 lg:py-6",
        className,
      )}
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl italic tracking-[-0.01em] text-stone-900 dark:text-stone-100">
        ${fmt(value)}
      </p>
      <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400 dark:text-stone-600">
        <span>{decoration}</span>
        <span>USDT</span>
      </div>
    </div>
  );
}

// ── Floor — section header + editorial tabs ───────────────────────────────
function FloorHeader({
  active,
  onChange,
  counts,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  counts: Record<TabKey, number>;
}) {
  return (
    <div className="border-y-[3px] border-double border-stone-900 px-5 dark:border-stone-200 sm:px-7">
      <div className="flex flex-wrap items-baseline justify-between gap-4 pt-7 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            § II
          </span>
          <h3 className="font-serif text-[34px] italic leading-none tracking-tight text-stone-900 dark:text-stone-100 sm:text-[40px]">
            The Floor
          </h3>
          <span className="hidden font-serif text-base italic text-stone-500 sm:inline">
            — what&apos;s trading, what&apos;s next.
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/explore"
            className="group inline-flex items-baseline gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-700 transition-colors hover:text-stone-950 dark:text-stone-300 dark:hover:text-white"
          >
            <span className="text-stone-400 transition-colors group-hover:text-lime">
              +
            </span>
            New
          </Link>
          <button
            disabled
            className="inline-flex items-baseline gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-600"
          >
            <span>✎</span>
            Edit
          </button>
        </div>
      </div>
      <nav className="-mb-px flex items-end gap-7 overflow-x-auto pt-1">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="relative flex shrink-0 items-baseline gap-2 pb-3"
            >
              <span
                className={cn(
                  "font-serif text-base italic transition-colors",
                  isActive
                    ? "text-stone-900 dark:text-stone-100"
                    : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300",
                )}
              >
                {tab.label}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums transition-colors",
                  isActive
                    ? "text-stone-700 dark:text-stone-300"
                    : "text-stone-400 dark:text-stone-600",
                )}
              >
                {pad2(counts[tab.key])}
              </span>
              {isActive ? (
                <motion.span
                  layoutId="floor-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-lime"
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                />
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ── Ticker row ────────────────────────────────────────────────────────────
function TickerRow({
  rank,
  creator,
  basePrice,
  isWatched,
  isOwned,
  onToggleWatch,
}: {
  rank: number;
  creator: CreatorMaybe;
  basePrice: number;
  isWatched: boolean;
  isOwned: boolean;
  onToggleWatch?: () => void;
}) {
  const creatorId = creator?.creatorId;
  const { data } = useTradePrice(creatorId);
  const { data: history } = useTradePriceHistory(creatorId, 24);
  const current = data?.price ?? basePrice;
  const change24hPct = data?.change24hPct ?? null;
  const hasChange = change24hPct !== null && Number.isFinite(change24hPct);
  const positive = (change24hPct ?? 0) >= 0;
  const sparkPoints = (history ?? []).map((p) => p.price);
  const ticker = deriveTicker(creator);

  return (
    <div className="group grid grid-cols-12 items-center gap-3 border-b border-stone-200 px-5 py-4 transition-colors hover:bg-stone-100/50 dark:border-stone-900 dark:hover:bg-stone-900/40 sm:gap-5 sm:px-7">
      {/* Rank column — serif italic numerals like a top-100 list */}
      <div className="col-span-1 hidden sm:block">
        <span className="font-serif text-2xl italic text-stone-300 tabular-nums dark:text-stone-700">
          {pad2(rank)}
        </span>
      </div>

      {/* Avatar + name + ticker — the editorial entry */}
      <Link
        href={creator?.slug ? `/creator/${creator.slug}` : "/explore"}
        className="col-span-7 flex min-w-0 items-center gap-3 sm:col-span-5"
      >
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-stone-300 dark:ring-stone-700">
          <Avatar creator={creator} size={44} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-[17px] tracking-tight text-stone-900 dark:text-stone-100">
            {isOwned ? (
              <span className="mr-1.5 align-middle text-lime" title="In your portfolio">
                ★
              </span>
            ) : null}
            {creator?.name ?? "Unknown creator"}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">
            <span className="text-stone-700 dark:text-stone-300">
              {ticker || "—"}
            </span>
            <span className="mx-1.5 text-stone-300 dark:text-stone-700">·</span>
            <span>{creator?.category ?? "Creator"}</span>
          </p>
        </div>
      </Link>

      {/* Sparkline — middle, generous */}
      <div className="col-span-3 hidden h-9 items-center text-stone-400 dark:text-stone-700 sm:flex">
        {sparkPoints.length >= 2 ? (
          <Sparkline
            points={sparkPoints}
            tone={positive ? "positive" : "negative"}
            strokeWidth={1.2}
          />
        ) : (
          <Sparkline points={[]} tone="neutral" strokeWidth={1} />
        )}
      </div>

      {/* Price block — mono numbers, tight stack */}
      <div className="col-span-4 ml-auto flex items-center gap-3 sm:col-span-2 sm:gap-5">
        <div className="text-right">
          <p className="font-mono text-[15px] font-semibold tabular-nums text-stone-900 dark:text-stone-100">
            ${current.toFixed(2)}
          </p>
          <div
            className={cn(
              "mt-0.5 flex items-center justify-end gap-0.5 font-mono text-[11px] tabular-nums",
              hasChange
                ? positive
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
                : "text-stone-400 dark:text-stone-600",
            )}
          >
            {hasChange ? (
              <>
                {positive ? "▲" : "▼"}
                {`${positive ? "+" : ""}${(change24hPct ?? 0).toFixed(2)}%`}
              </>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>

        <button
          onClick={onToggleWatch}
          aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-colors",
            isWatched
              ? "text-lime"
              : "text-stone-300 hover:text-stone-500 dark:text-stone-700 dark:hover:text-stone-400",
          )}
        >
          <Star
            className={cn("h-4 w-4", isWatched && "fill-current")}
            strokeWidth={1.4}
          />
        </button>
      </div>
    </div>
  );
}

function Colophon({ count }: { count: number }) {
  return (
    <div className="px-5 py-8 text-center sm:px-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400 dark:text-stone-600">
        {count} {count === 1 ? "entry" : "entries"} · end of section
      </p>
      <p className="mt-2 font-serif text-sm italic text-stone-400 dark:text-stone-600">
        ❦
      </p>
    </div>
  );
}

function EditorialEmpty({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="px-5 py-16 text-center sm:px-7">
      <p className="font-serif text-3xl italic text-stone-900 dark:text-stone-100">
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-md font-serif text-base italic text-stone-500 dark:text-stone-400">
        {description}
      </p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-6 inline-flex items-baseline gap-2 border-b border-stone-900 pb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-900 transition-colors hover:border-lime hover:text-stone-950 dark:border-stone-100 dark:text-stone-100 dark:hover:border-lime dark:hover:text-white"
        >
          <span className="text-lime">→</span>
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [tab, setTab] = useState<TabKey>("tradable");
  const { data: offerings } = useIpos();
  const { data: creators } = useCreators();
  const { data: portfolio } = usePortfolioHoldings();
  const watchlist = useWatchlist();

  const totalValue = portfolio?.totalPortfolioValue ?? 0;
  const cash = portfolio?.usdtBalance ?? portfolio?.usdcBalance ?? 0;
  const locked = portfolio?.lockedUsdtBalance ?? 0;
  const invested = (portfolio?.holdings ?? []).reduce(
    (sum, h) => sum + h.currentValue,
    0,
  );
  const gainLoss = (portfolio?.holdings ?? []).reduce(
    (sum, h) => sum + h.gainLoss,
    0,
  );
  const costBasis = invested - gainLoss;
  const change24hValue = invested > 0 ? gainLoss : null;
  const change24hPct =
    invested > 0 && costBasis > 0 ? (gainLoss / costBasis) * 100 : null;

  const ownedCreatorIds = useMemo(
    () =>
      new Set(
        (portfolio?.holdings ?? []).map((h) => h.creatorId).filter(Boolean),
      ),
    [portfolio?.holdings],
  );

  const grouped = useMemo(() => {
    const tradable = (offerings ?? []).filter((o) => o.status === "closed");
    const upcoming = (offerings ?? []).filter(
      (o) => o.status === "upcoming" || o.status === "active",
    );
    const watched = (creators ?? [])
      .filter((c) => watchlist.has(c.creatorId))
      .map<
        Offering | { creator: Creator; pricePerToken: number; ipoId: string }
      >((c) => {
        const matchingOffering = (offerings ?? []).find(
          (o) => o.creator?.creatorId === c.creatorId,
        );
        return (
          matchingOffering ?? {
            ipoId: `watch-${c.creatorId}`,
            creator: c,
            pricePerToken: 0,
          }
        );
      });
    return { tradable, upcoming, watched };
  }, [offerings, creators, watchlist]);

  const counts: Record<TabKey, number> = {
    tradable: grouped.tradable.length,
    upcoming: grouped.upcoming.length,
    watchlist: grouped.watched.length,
  };

  const visible: Array<{
    ipoId: string;
    creator: CreatorMaybe;
    pricePerToken: number;
  }> =
    tab === "tradable"
      ? grouped.tradable
      : tab === "upcoming"
        ? grouped.upcoming
        : grouped.watched;

  return (
    <div
      className={cn(
        "relative -mx-5 -my-6 min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#faf7ee] text-stone-900 dark:bg-[#0c0a07] dark:text-stone-100 sm:-mx-7 lg:-mx-8 lg:-my-6 lg:min-h-screen",
      )}
    >
      {/* Paper grain — multiplied in light, screened in dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply dark:opacity-[0.16] dark:mix-blend-screen"
        style={{ backgroundImage: GRAIN, backgroundSize: "220px 220px" }}
      />

      <div className="relative">
        <Masthead />
        <StandingHero
          totalValue={totalValue}
          change24hValue={change24hValue}
          change24hPct={change24hPct}
        />
        <CapitalPanel
          invested={invested}
          costBasis={costBasis}
          cash={cash}
          locked={locked}
        />
        <FloorHeader active={tab} onChange={setTab} counts={counts} />

        {visible.length === 0 ? (
          tab === "watchlist" ? (
            <EditorialEmpty
              title="A blank page."
              description="Star any creator and they'll be filed here for safekeeping."
              cta={{ href: "/explore", label: "Browse the floor" }}
            />
          ) : tab === "tradable" ? (
            <EditorialEmpty
              title="Nothing trading yet."
              description="Once a raise closes, its token lands here, ready for the secondary market."
              cta={{ href: "/explore", label: "See live raises" }}
            />
          ) : (
            <EditorialEmpty
              title="Nothing on the slate."
              description="New offerings drop on a regular schedule. Check back tomorrow."
              cta={{ href: "/explore", label: "Browse the floor" }}
            />
          )
        ) : (
          <>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {visible.map((item, i) => {
                const creatorId = item.creator?.creatorId ?? "";
                return (
                  <TickerRow
                    key={item.ipoId}
                    rank={i + 1}
                    creator={item.creator}
                    basePrice={item.pricePerToken}
                    isWatched={watchlist.has(creatorId)}
                    isOwned={ownedCreatorIds.has(creatorId)}
                    onToggleWatch={
                      creatorId
                        ? () => watchlist.toggle(creatorId)
                        : undefined
                    }
                  />
                );
              })}
            </motion.div>
            <Colophon count={visible.length} />
          </>
        )}
      </div>
    </div>
  );
}
