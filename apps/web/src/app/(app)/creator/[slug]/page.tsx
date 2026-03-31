"use client";

import { use, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  DollarSign,
  ExternalLink,
  ArrowRightLeft,
  Rocket,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

/* ── IPO Purchase Form ─────────────────────────────────────────────── */

interface IPOPurchaseFormProps {
  ipoId: string;
  pricePerToken: number;
  remaining: number;
  onSuccess: () => void;
}

function IPOPurchaseForm({ ipoId, pricePerToken, remaining, onSuccess }: IPOPurchaseFormProps) {
  const [quantity, setQuantity] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const purchase = trpc.ipo.purchase.useMutation();
  const qty = parseInt(quantity, 10) || 0;
  const total = qty * pricePerToken;

  async function handleBuy() {
    if (qty < 1) { setError("Enter a valid quantity"); return; }
    setError(null);
    try {
      await purchase.mutateAsync({ ipoId, quantity: qty });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    }
  }

  if (success) {
    return (
      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-6 text-center">
        <p className="font-semibold text-emerald-400">Purchase submitted!</p>
        <p className="mt-1 text-sm text-zinc-400">Tokens credited after the IPO closes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-500">Quantity (tokens)</label>
        <input
          type="number"
          min="1"
          max={remaining}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-lg text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-zinc-600">{remaining.toLocaleString()} remaining</p>
      </div>
      <div className="rounded-lg bg-zinc-800 px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Total cost</span>
          <span className="font-semibold">{formatUSD(total)}</span>
        </div>
      </div>
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <Button onClick={handleBuy} disabled={purchase.isPending || qty < 1} className="w-full">
        {purchase.isPending ? "Processing…" : `Buy ${qty.toLocaleString()} tokens`}
      </Button>
      <p className="text-center text-xs text-zinc-600">Tokens credited when the IPO closes</p>
    </div>
  );
}

/* ── Trade Form (Secondary Market) ─────────────────────────────────── */

interface TradeFormProps {
  creatorId: string;
  creatorName: string;
  currentPrice: number;
  onTraded: () => void;
}

function TradeForm({ creatorId, creatorName, currentPrice, onTraded }: TradeFormProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    side: string;
    quantity: number;
    price: number;
    fee: number;
  } | null>(null);

  const trade = trpc.trade.execute.useMutation();
  const usdAmount = parseFloat(amount) || 0;
  const estQuantity = currentPrice > 0 ? usdAmount * 0.99 / currentPrice : 0; // net of 1% fee

  async function handleTrade() {
    if (usdAmount < 0.01) { setError("Enter a valid amount"); return; }
    setError(null);
    try {
      const res = await trade.mutateAsync({ creatorId, side, usdAmount });
      setResult(res);
      onTraded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trade failed");
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-4 text-center">
          <p className="font-semibold text-emerald-400">
            {result.side === "buy" ? "Bought" : "Sold"} {result.quantity.toFixed(6)} tokens
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            @ {formatUSD(result.price)} · Fee: {formatUSD(result.fee)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => { setResult(null); setAmount(""); }}
          className="w-full"
        >
          New trade
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buy/Sell tabs */}
      <div className="flex rounded-lg border border-zinc-700 p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSide(s); setError(null); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              side === s
                ? s === "buy"
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {s === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-500">Amount (USD)</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-lg text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {usdAmount > 0 && (
        <div className="rounded-lg bg-zinc-800 px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Est. tokens</span>
            <span className="font-medium">~{estQuantity.toFixed(4)} {creatorName}</span>
          </div>
          <div className="flex justify-between text-xs text-zinc-600">
            <span>Fee (1%)</span>
            <span>{formatUSD(usdAmount * 0.01)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button
        onClick={handleTrade}
        disabled={trade.isPending || usdAmount < 0.01}
        className={`w-full ${side === "sell" ? "bg-red-600 hover:bg-red-500" : ""}`}
      >
        {trade.isPending
          ? "Processing…"
          : `${side === "buy" ? "Buy" : "Sell"} ${creatorName}`}
      </Button>

      <p className="text-center text-xs text-zinc-600">
        1% trading fee (0.5% to creator, 0.5% to platform)
      </p>
    </div>
  );
}

/* ── Recent Trades ─────────────────────────────────────────────────── */

function RecentTrades({ creatorId }: { creatorId: string }) {
  const { data: trades, isLoading } = trpc.trade.creatorTrades.useQuery(
    { creatorId, limit: 10 },
    { refetchInterval: 15_000 },
  );

  if (isLoading) return <div className="h-32 animate-pulse rounded-xl bg-zinc-900" />;
  if (!trades?.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-8 text-center text-zinc-500 text-sm">
        No trades yet
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-6 py-3">
        <h3 className="text-sm font-semibold">Recent Trades</h3>
      </div>
      <div className="divide-y divide-zinc-800">
        {trades.map((t) => (
          <div key={t.tradeId} className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  t.side === "buy"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {t.side.toUpperCase()}
              </span>
              <span className="text-sm">{t.quantity.toFixed(4)} tokens</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formatUSD(t.usdAmount)}</p>
              <p className="text-xs text-zinc-600">
                @ {formatUSD(t.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────── */

export default function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [, setPurchaseSuccess] = useState(false);

  const { data: creator, isLoading } = trpc.creator.getBySlug.useQuery({ slug });
  const { data: ipos, refetch: refetchIpos } = trpc.ipo.getByCreator.useQuery(
    { creatorId: creator?.creatorId ?? "" },
    { enabled: !!creator?.creatorId },
  );
  const { data: priceData, refetch: refetchPrice } = trpc.trade.price.useQuery(
    { creatorId: creator?.creatorId ?? "" },
    { enabled: !!creator?.creatorId, refetchInterval: 10_000 },
  );
  const { data: priceHistory } = trpc.trade.priceHistory.useQuery(
    { creatorId: creator?.creatorId ?? "", limit: 50 },
    { enabled: !!creator?.creatorId },
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-zinc-900" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-80 animate-pulse rounded-xl bg-zinc-900" />
          <div className="h-80 animate-pulse rounded-xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-16 text-center text-zinc-500">
        Creator not found.
      </div>
    );
  }

  const activeIpo = ipos?.find((i) => i.status === "active");
  const upcomingIpo = ipos?.find((i) => i.status === "upcoming");
  const currentIpo = activeIpo ?? upcomingIpo;
  const isIPOPhase = !!currentIpo;
  const currentPrice = priceData?.price ?? null;

  const ipoSold = activeIpo?.sold ?? 0;
  const percentSold = activeIpo
    ? Math.round((ipoSold / activeIpo.totalSupply) * 100)
    : 0;

  // Simple 24h price change from history
  const priceChange24h = (() => {
    if (!priceHistory || priceHistory.length < 2 || !currentPrice) return null;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oldest = priceHistory.find((p) => (p.timestamp ?? 0) >= dayAgo) ?? priceHistory[0];
    if (!oldest || oldest.price === 0) return null;
    return ((currentPrice - oldest.price) / oldest.price) * 100;
  })();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-5">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-700 text-3xl font-bold">
              {creator.name[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{creator.name}</h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeIpo
                    ? "bg-emerald-500/10 text-emerald-400"
                    : upcomingIpo
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {activeIpo ? "IPO Live" : upcomingIpo ? "IPO Soon" : "Live"}
              </span>
            </div>
            <p className="mt-1 text-zinc-500">{creator.category}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {creator.tags?.map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        {creator.youtubeUrl && (
          <a
            href={creator.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800"
          >
            YouTube <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Main content */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isIPOPhase ? (
            /* IPO progress card */
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-1 flex items-center gap-2">
                <Rocket className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-semibold">
                  {activeIpo ? "IPO In Progress" : "Upcoming IPO"}
                </h3>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Price per Token</p>
                  <p className="text-2xl font-bold">${currentIpo!.pricePerToken.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total Supply</p>
                  <p className="text-2xl font-bold">
                    {(currentIpo!.totalSupply / 1_000_000).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Valuation</p>
                  <p className="text-2xl font-bold">
                    ${formatNumber(currentIpo!.totalSupply * currentIpo!.pricePerToken)}
                  </p>
                </div>
              </div>
              {activeIpo && (
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-400">{percentSold}% sold</span>
                    <span className="text-zinc-500">
                      {(activeIpo.totalSupply - ipoSold).toLocaleString()} remaining
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${percentSold}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="h-4 w-4" />
                {activeIpo
                  ? `Ends ${new Date(currentIpo!.endsAt).toLocaleDateString()}`
                  : `Starts ${new Date(currentIpo!.startsAt).toLocaleDateString()}`}
              </div>
            </div>
          ) : (
            /* Post-IPO price card */
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm text-zinc-500">Current Price</p>
              <div className="flex items-end gap-3">
                {currentPrice !== null ? (
                  <>
                    <p className="text-4xl font-bold">${currentPrice.toFixed(2)}</p>
                    {priceChange24h !== null && (
                      <p
                        className={`mb-1 flex items-center gap-1 text-sm font-medium ${
                          priceChange24h >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {priceChange24h >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {priceChange24h >= 0 ? "+" : ""}
                        {priceChange24h.toFixed(2)}% (24h)
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-4xl font-bold text-zinc-600">—</p>
                )}
              </div>

              {/* Mini price chart */}
              {priceHistory && priceHistory.length > 1 && (
                <div className="mt-6 h-32">
                  <MiniChart data={priceHistory.map((p) => p.price)} />
                </div>
              )}
              {(!priceHistory || priceHistory.length <= 1) && (
                <div className="mt-6 flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-sm text-zinc-600">
                  Chart data will appear after trades begin
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          {activeIpo ? (
            <>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Rocket className="h-5 w-5" /> Invest in IPO
              </h3>
              <IPOPurchaseForm
                ipoId={activeIpo.ipoId}
                pricePerToken={activeIpo.pricePerToken}
                remaining={activeIpo.totalSupply - ipoSold}
                onSuccess={() => { setPurchaseSuccess(true); refetchIpos(); }}
              />
            </>
          ) : upcomingIpo ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Clock className="h-10 w-10 text-yellow-400" />
              <p className="font-semibold">IPO coming soon</p>
              <p className="text-sm text-zinc-500">
                Starts {new Date(upcomingIpo.startsAt).toLocaleDateString()}
              </p>
            </div>
          ) : currentPrice !== null ? (
            <>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <ArrowRightLeft className="h-5 w-5" /> Trade
              </h3>
              <TradeForm
                creatorId={creator.creatorId}
                creatorName={creator.name}
                currentPrice={currentPrice}
                onTraded={() => refetchPrice()}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-zinc-500">
              <ArrowRightLeft className="h-10 w-10" />
              <p className="font-semibold">Trading not yet available</p>
              <p className="text-sm">No price established for this creator.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: Users, label: "Subscribers", value: formatNumber(creator.subscriberCount ?? 0) },
          { icon: Eye, label: "Avg Views", value: formatNumber(creator.avgViews ?? 0) },
          { icon: DollarSign, label: "Revenue/mo", value: formatUSD(creator.monthlyRevenue ?? 0), highlight: true },
          { icon: TrendingUp, label: "Valuation", value: formatUSD(creator.valuation ?? 0) },
        ].map(({ icon: Icon, label, value, highlight }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-2 flex items-center gap-2 text-zinc-500">
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
            </div>
            <p className={`text-xl font-bold ${highlight ? "text-emerald-400" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent trades (post-IPO only) */}
      {!isIPOPhase && (
        <div className="mt-6">
          <RecentTrades creatorId={creator.creatorId} />
        </div>
      )}

      {/* Dividend Info (post-IPO only) */}
      {!isIPOPhase && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-4 text-lg font-semibold">Dividend Info</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Revenue Share</p>
              <p className="text-lg font-semibold">
                {((creator.revenueShareBps ?? 0) / 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Est. Annual Yield</p>
              <p className="text-lg font-semibold text-emerald-400">—</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Next Payout</p>
              <p className="text-lg font-semibold">Monthly</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mini SVG Chart ────────────────────────────────────────────────── */

function MiniChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 600;
  const h = 120;
  const pad = 4;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (w - pad * 2) + pad;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = data[data.length - 1] >= data[0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#10b981" : "#ef4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
