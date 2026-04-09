"use client";

import { useState } from "react";
import { Rocket, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-lg text-zinc-900 placeholder-zinc-400 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20 transition-all";

interface PurchaseModalProps {
  ipoId: string;
  creatorName: string;
  pricePerToken: number;
  remaining: number;
  onClose: () => void;
  onSuccess: () => void;
}

function PurchaseModal({ ipoId, creatorName, pricePerToken, remaining, onClose, onSuccess }: PurchaseModalProps) {
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
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Invest in {creatorName}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {done ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-8 text-center">
              <p className="font-semibold text-emerald-700">Purchase submitted!</p>
              <p className="mt-1 text-sm text-zinc-500">Tokens credited after the IPO closes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-500">Quantity (tokens)</label>
                <input type="number" min="1" max={remaining} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
                <p className="mt-1 text-xs text-zinc-400">{remaining.toLocaleString()} remaining &middot; ${pricePerToken.toFixed(2)} each</p>
              </div>
              <div className="rounded-xl bg-zinc-50 px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total cost</span>
                  <span className="font-semibold text-zinc-900">{formatUSD(total)}</span>
                </div>
              </div>
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleSubmit} disabled={purchase.isPending || qty < 1} className="flex-1">
                  {purchase.isPending ? "Processing..." : "Invest"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function IPOPage() {
  const [selectedIpo, setSelectedIpo] = useState<string | null>(null);
  const { data: ipos, isLoading, refetch } = trpc.ipo.list.useQuery();
  const selectedData = ipos?.find((i) => i.ipoId === selectedIpo);

  return (
    <div>
      <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold font-serif text-zinc-900">Creator IPOs</h1>
        <p className="mt-2 text-zinc-500">Get in early on rising creators at a fixed price</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : !ipos?.length ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center text-zinc-400">
          No active IPOs right now. Check back soon.
        </div>
      ) : (
        <div className="space-y-5">
          {ipos.map((ipo, i) => {
            const percentSold = ipo.totalSupply > 0 ? Math.round(((ipo.sold ?? 0) / ipo.totalSupply) * 100) : 0;
            const isActive = ipo.status === "active";
            const creator = ipo.creator;

            return (
              <motion.div
                key={ipo.ipoId}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {creator?.avatarUrl ? (
                      <img src={creator.avatarUrl} alt={creator.name} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime/30 text-xl font-bold text-zinc-900">
                        {creator?.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-900">{creator?.name ?? "Unknown Creator"}</h3>
                      <p className="text-sm text-zinc-400">{creator?.category}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {isActive ? "Live" : "Upcoming"}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div><p className="text-xs text-zinc-400">Price per Token</p><p className="text-lg font-semibold text-zinc-900">${ipo.pricePerToken.toFixed(2)}</p></div>
                  <div><p className="text-xs text-zinc-400">Total Supply</p><p className="text-lg font-semibold text-zinc-900">{(ipo.totalSupply / 1_000_000).toFixed(1)}M</p></div>
                  <div><p className="text-xs text-zinc-400">Revenue/mo</p><p className="text-lg font-semibold text-emerald-600">{formatUSD(creator?.monthlyRevenue ?? 0)}</p></div>
                  <div><p className="text-xs text-zinc-400">Valuation</p><p className="text-lg font-semibold text-zinc-900">{formatUSD(ipo.totalSupply * ipo.pricePerToken)}</p></div>
                </div>

                {isActive && ipo.totalSupply > 0 && (
                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-500">{percentSold}% sold</span>
                      <span className="text-zinc-400">{(ipo.totalSupply - (ipo.sold ?? 0)).toLocaleString()} remaining</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100">
                      <motion.div
                        className="h-full rounded-full bg-lime"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentSold}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Clock className="h-4 w-4" />
                    {isActive ? `Ends ${new Date(ipo.endsAt).toLocaleDateString()}` : `Starts ${new Date(ipo.startsAt).toLocaleDateString()}`}
                  </div>
                  {creator?.slug && (
                    <div className="flex items-center gap-3">
                      <a href={`/creator/${creator.slug}`} className="text-sm text-zinc-400 hover:text-zinc-900 transition-colors">View creator &rarr;</a>
                      <Button onClick={() => setSelectedIpo(ipo.ipoId)} disabled={!isActive} variant={isActive ? "default" : "outline"}>
                        {isActive ? (<><Rocket className="mr-2 h-4 w-4" />Invest Now</>) : "Coming Soon"}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedData && selectedData.status === "active" && (
          <PurchaseModal
            ipoId={selectedData.ipoId}
            creatorName={selectedData.creator?.name ?? "Creator"}
            pricePerToken={selectedData.pricePerToken}
            remaining={selectedData.totalSupply - (selectedData.sold ?? 0)}
            onClose={() => setSelectedIpo(null)}
            onSuccess={() => { setSelectedIpo(null); refetch(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
