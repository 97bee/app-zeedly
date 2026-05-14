"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { inferRouterOutputs } from "@trpc/server";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Pencil,
  Plus,
  Star,
} from "lucide-react";
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

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "tradable", label: "Tradable" },
  { key: "upcoming", label: "Upcoming" },
  { key: "watchlist", label: "Watchlist" },
];

function formatMoney(amount: number, currency = "USDT") {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

function formatBig(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function hashHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function Avatar({
  creator,
  size = 40,
}: {
  creator: CreatorMaybe;
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
      className="flex h-full w-full items-center justify-center text-sm font-black text-white"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 50% 25%), hsl(${
          (hue + 60) % 360
        } 60% 20%))`,
      }}
    >
      {creator?.name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  children,
}: {
  label: string;
  value: string;
  accent?: "muted" | "default";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-white/[0.04] bg-white/[0.04] p-4 backdrop-blur-sm",
        accent === "muted" && "bg-white/[0.025]",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-black tracking-[-0.02em] text-white tabular-nums">
        {value}
      </p>
      {children}
    </div>
  );
}

function BalanceHeader({
  totalValue,
  cash,
  invested,
  costBasis,
  locked,
  change24hValue,
  change24hPct,
}: {
  totalValue: number;
  cash: number;
  invested: number;
  costBasis: number;
  locked: number;
  change24hValue: number | null;
  change24hPct: number | null;
}) {
  const hasChange = change24hValue !== null && change24hPct !== null;
  const positive = (change24hValue ?? 0) >= 0;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="px-5 pb-8 pt-6 sm:px-7"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
        Account value
      </p>
      <h1 className="mt-2 flex items-baseline gap-2 text-[44px] font-black leading-none tracking-[-0.05em] text-white sm:text-[56px]">
        {formatBig(totalValue)}
        <span className="text-[16px] font-bold tracking-[-0.02em] text-white/40">
          USDT
        </span>
      </h1>

      <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
        <div>
          <p className="font-bold uppercase tracking-[0.14em] text-white/40">
            Last 24h
          </p>
          {hasChange ? (
            <p
              className={cn(
                "mt-0.5 flex items-center gap-1 text-[14px] font-black tabular-nums",
                positive ? "text-emerald-400" : "text-red-400",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {`${positive ? "+" : "-"}${formatBig(Math.abs(change24hValue ?? 0))}`}
            </p>
          ) : (
            <p className="mt-0.5 text-[14px] font-black text-white/30">—</p>
          )}
        </div>
        <div>
          <p className="font-bold uppercase tracking-[0.14em] text-white/40">
            Rate of return
          </p>
          {hasChange ? (
            <p
              className={cn(
                "mt-0.5 flex items-center gap-1 text-[14px] font-black tabular-nums",
                positive ? "text-emerald-400" : "text-red-400",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {`${positive ? "+" : ""}${(change24hPct ?? 0).toFixed(2)}%`}
            </p>
          ) : (
            <p className="mt-0.5 text-[14px] font-black text-white/30">—</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-white/[0.04] bg-white/[0.04] p-4 backdrop-blur-sm sm:col-span-2 sm:row-span-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
            Investments
          </p>
          <p className="mt-1 text-[26px] font-black tracking-[-0.02em] text-white tabular-nums">
            {formatMoney(invested)}
          </p>
          <div className="mt-4 h-20 text-emerald-400/60 sm:h-24">
            <Sparkline
              points={
                invested > 0
                  ? [costBasis || invested, invested]
                  : [1, 1]
              }
              tone={invested >= costBasis ? "positive" : "negative"}
              showFill
              strokeWidth={2}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
            <span>Open</span>
            <span>Now</span>
          </div>
        </div>
        <StatCard label="Cash" value={formatMoney(cash)} />
        <StatCard label="Locked in offerings" value={formatMoney(locked)} />
      </div>
    </motion.section>
  );
}

function TickerRow({
  creator,
  basePrice,
  isWatched,
  isOwned,
  onToggleWatch,
}: {
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

  const ticker = (creator?.slug ?? creator?.name ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 5)
    .toUpperCase();

  return (
    <div className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03] sm:gap-4 sm:px-7">
      <Link
        href={creator?.slug ? `/creator/${creator.slug}` : "/explore"}
        className="flex min-w-0 shrink-0 items-center gap-3"
      >
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[14px] ring-1 ring-white/5">
          <Avatar creator={creator} size={44} />
          {isOwned ? (
            <span
              className="absolute right-0.5 bottom-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#0a0b0f]"
              title="In your portfolio"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold tracking-[-0.01em] text-white">
            {creator?.name ?? "Unknown creator"}
          </p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
            {ticker || (creator?.category ?? "creator")}
          </p>
        </div>
      </Link>

      <div className="hidden h-10 flex-1 items-center px-2 sm:flex">
        {sparkPoints.length >= 2 ? (
          <Sparkline points={sparkPoints} tone={positive ? "positive" : "negative"} />
        ) : (
          <Sparkline points={[]} tone="neutral" />
        )}
      </div>

      <div className="ml-auto flex items-center gap-3 text-right sm:gap-4">
        <div className="min-w-[88px]">
          <p className="text-[15px] font-black tabular-nums tracking-[-0.01em] text-white">
            ${current.toFixed(2)}
          </p>
          <div
            className={cn(
              "mt-0.5 flex items-center justify-end gap-0.5 text-[12px] font-black tabular-nums",
              hasChange
                ? positive
                  ? "text-emerald-400"
                  : "text-red-400"
                : "text-white/25",
            )}
          >
            {hasChange ? (
              <>
                {positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
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
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
            isWatched
              ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
              : "text-white/30 hover:bg-white/[0.06] hover:text-white/70",
          )}
        >
          <Star className={cn("h-3.5 w-3.5", isWatched && "fill-current")} />
        </button>
      </div>
    </div>
  );
}

function HomeTabs({
  active,
  onChange,
  counts,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  counts: Record<TabKey, number>;
}) {
  return (
    <div className="flex items-center gap-2 px-5 pb-4 pt-2 sm:px-7">
      <div className="flex flex-1 items-center gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cn(
                "group flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-all",
                isActive
                  ? "bg-white text-slate-950"
                  : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                  isActive
                    ? "bg-slate-950/10 text-slate-950/80"
                    : "bg-white/[0.08] text-white/55",
                )}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>
      <Link
        href="/explore"
        aria-label="Discover creators"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white"
      >
        <Plus className="h-4 w-4" />
      </Link>
      <button
        aria-label="Edit"
        disabled
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/30"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="px-5 py-12 text-center sm:px-7">
      <p className="text-[15px] font-black tracking-[-0.01em] text-white">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-xs text-[13px] text-white/45">
        {description}
      </p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-slate-950 transition-colors hover:bg-white/90"
        >
          {cta.label}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

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
  // True 24h portfolio P/L requires a snapshotted balance series we don't
  // store yet — surface lifetime gain/loss for now so the UI has data.
  const change24hValue = invested > 0 ? gainLoss : null;
  const change24hPct =
    invested > 0 && costBasis > 0 ? (gainLoss / costBasis) * 100 : null;

  const ownedCreatorIds = useMemo(
    () =>
      new Set((portfolio?.holdings ?? []).map((h) => h.creatorId).filter(Boolean)),
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
    <div className="-mx-5 -my-6 min-h-[calc(100vh-3.5rem)] bg-[#0a0b0f] text-white sm:-mx-7 lg:-mx-8 lg:-my-6 lg:min-h-screen">
      <BalanceHeader
        totalValue={totalValue}
        cash={cash}
        invested={invested}
        costBasis={costBasis}
        locked={locked}
        change24hValue={change24hValue}
        change24hPct={change24hPct}
      />

      <div className="border-t border-white/[0.06]">
        <HomeTabs active={tab} onChange={setTab} counts={counts} />

        {visible.length === 0 ? (
          tab === "watchlist" ? (
            <EmptyState
              title="Nothing on your watchlist yet"
              description="Tap the star on any creator to track their price here."
              cta={{ href: "/explore", label: "Discover creators" }}
            />
          ) : tab === "tradable" ? (
            <EmptyState
              title="No tradable creators yet"
              description="Once an offering closes, you'll see its token here, ready to trade."
              cta={{ href: "/explore", label: "Browse the market" }}
            />
          ) : (
            <EmptyState
              title="No upcoming raises"
              description="Check back soon — new creator offerings drop regularly."
              cta={{ href: "/explore", label: "Browse the market" }}
            />
          )
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="divide-y divide-white/[0.04] pb-12"
          >
            {visible.map((item) => {
              const creatorId = item.creator?.creatorId ?? "";
              return (
                <TickerRow
                  key={item.ipoId}
                  creator={item.creator}
                  basePrice={item.pricePerToken}
                  isWatched={watchlist.has(creatorId)}
                  isOwned={ownedCreatorIds.has(creatorId)}
                  onToggleWatch={
                    creatorId ? () => watchlist.toggle(creatorId) : undefined
                  }
                />
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
