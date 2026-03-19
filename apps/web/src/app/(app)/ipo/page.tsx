"use client";

import { useState } from "react";
import { Rocket, Clock, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface PurchaseModalProps {
  ipoId: string;
  creatorName: string;
  pricePerToken: number;
  remaining: number;
  onClose: () => void;
  onSuccess: () => void;
}

function PurchaseModal({
  ipoId,
  creatorName,
  pricePerToken,
  remaining,
  onClose,
  onSuccess,
}: PurchaseModalProps) {
  const [quantity, setQuantity] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const purchase = trpc.ipo.purchase.useMutation();
  const qty = parseInt(quantity, 10) || 0;
  const total = qty * pricePerToken;

  async function handleSubmit() {
    if (qty < 1) { setError("Enter a valid quantity"); return; }
    setError(null);
    try {
      await purchase.mutateAsync({ ipoId, quantity: qty });
      setDone(true);
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold">Invest in {creatorName}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-8 text-center">
              <p className="font-semibold text-emerald-400">Purchase submitted!</p>
              <p className="mt-1 text-sm text-zinc-400">
                Tokens will be credited to your wallet after the IPO closes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">Quantity (tokens)</label>
                <input
                  type="number"
                  min="1"
                  max={remaining}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-zinc-600">
                  {remaining.toLocaleString()} tokens remaining · ${pricePerToken.toFixed(2)} each
                </p>
              </div>

              <div className="rounded-lg bg-zinc-900 px-4 py-3">
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

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={purchase.isPending || qty < 1}
                  className="flex-1"
                >
                  {purchase.isPending ? "Processing…" : "Invest"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IPOPage() {
  const [selectedIpo, setSelectedIpo] = useState<string | null>(null);
  const { data: ipos, isLoading, refetch } = trpc.ipo.list.useQuery();

  const selectedData = ipos?.find((i) => i.ipoId === selectedIpo);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Creator IPOs</h1>
        <p className="mt-2 text-zinc-400">Get in early on rising creators at a fixed price</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : !ipos?.length ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-16 text-center text-zinc-500">
          No active IPOs right now. Check back soon.
        </div>
      ) : (
        <div className="space-y-6">
          {ipos.map((ipo) => {
            const percentSold =
              ipo.totalSupply > 0 ? Math.round(((ipo.sold ?? 0) / ipo.totalSupply) * 100) : 0;
            const isActive = ipo.status === "active";
            const creator = ipo.creator;

            return (
              <div
                key={ipo.ipoId}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {creator?.avatarUrl ? (
                      <img
                        src={creator.avatarUrl}
                        alt={creator.name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-xl font-bold">
                        {creator?.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">
                        {creator?.name ?? "Unknown Creator"}
                      </h3>
                      <p className="text-sm text-zinc-500">{creator?.category}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {isActive ? "Live" : "Upcoming"}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-zinc-500">Price per Token</p>
                    <p className="text-lg font-semibold">${ipo.pricePerToken.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Total Supply</p>
                    <p className="text-lg font-semibold">
                      {(ipo.totalSupply / 1_000_000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Revenue/mo</p>
                    <p className="text-lg font-semibold text-emerald-400">
                      {formatUSD(creator?.monthlyRevenue ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Valuation</p>
                    <p className="text-lg font-semibold">
                      {formatUSD(ipo.totalSupply * ipo.pricePerToken)}
                    </p>
                  </div>
                </div>

                {isActive && ipo.totalSupply > 0 && (
                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-400">{percentSold}% sold</span>
                      <span className="text-zinc-500">
                        {(ipo.totalSupply - (ipo.sold ?? 0)).toLocaleString()} remaining
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

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Clock className="h-4 w-4" />
                    {isActive
                      ? `Ends ${new Date(ipo.endsAt).toLocaleDateString()}`
                      : `Starts ${new Date(ipo.startsAt).toLocaleDateString()}`}
                  </div>

                  {creator?.slug && (
                    <div className="flex items-center gap-3">
                      <a
                        href={`/creator/${creator.slug}`}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        View creator →
                      </a>
                      <Button
                        onClick={() => setSelectedIpo(ipo.ipoId)}
                        disabled={!isActive}
                        variant={isActive ? "default" : "outline"}
                        className={!isActive ? "cursor-not-allowed text-zinc-500" : ""}
                      >
                        {isActive ? (
                          <>
                            <Rocket className="mr-2 h-4 w-4" />
                            Invest Now
                          </>
                        ) : (
                          "Coming Soon"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedData && selectedData.status === "active" && (
        <PurchaseModal
          ipoId={selectedData.ipoId}
          creatorName={selectedData.creator?.name ?? "Creator"}
          pricePerToken={selectedData.pricePerToken}
          remaining={selectedData.totalSupply - (selectedData.sold ?? 0)}
          onClose={() => setSelectedIpo(null)}
          onSuccess={() => {
            setSelectedIpo(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
