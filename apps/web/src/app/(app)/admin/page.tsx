"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminCreators } from "@/features/admin/hooks/useAdminCreators";
import { useApproveCreator } from "@/features/admin/hooks/useApproveCreator";
import { useRejectCreator } from "@/features/admin/hooks/useRejectCreator";
import { useLaunchIpo } from "@/features/admin/hooks/useLaunchIpo";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  live: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20 transition-all";

function LaunchOfferingForm({ creatorId, onLaunched }: { creatorId: string; onLaunched: () => void }) {
  const [price, setPrice] = useState("1.00");
  const [supply, setSupply] = useState("1000000");
  const [raiseTarget, setRaiseTarget] = useState("1000000");
  const [maxPerAccount, setMaxPerAccount] = useState("5000");
  const [daysOpen, setDaysOpen] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const launch = useLaunchIpo();

  async function handleLaunch() {
    const priceVal = parseFloat(price);
    const supplyVal = parseInt(supply, 10);
    const raiseTargetVal = parseFloat(raiseTarget);
    const maxPerAccountVal = parseFloat(maxPerAccount);
    const days = parseInt(daysOpen, 10);
    if (isNaN(priceVal) || priceVal <= 0) { setError("Invalid price"); return; }
    if (isNaN(supplyVal) || supplyVal < 1000) { setError("Min supply 1,000"); return; }
    if (isNaN(raiseTargetVal) || raiseTargetVal < priceVal) { setError("Invalid raise target"); return; }
    if (raiseTargetVal > priceVal * supplyVal) { setError("Target exceeds supply value"); return; }
    if (Math.abs(raiseTargetVal / priceVal - Math.round(raiseTargetVal / priceVal)) > 0.000001) {
      setError("Target must equal a whole number of tokens");
      return;
    }
    if (isNaN(maxPerAccountVal) || maxPerAccountVal < priceVal) { setError("Invalid account max"); return; }
    if (maxPerAccountVal > raiseTargetVal) { setError("Account max cannot exceed target"); return; }
    if (isNaN(days) || days < 1) { setError("Invalid duration"); return; }
    const now = Date.now();
    setError(null);
    try {
      await launch.mutateAsync({
        creatorId,
        pricePerToken: priceVal,
        totalSupply: supplyVal,
        raiseTargetUsd: raiseTargetVal,
        maxInvestmentPerAccountUsd: maxPerAccountVal,
        startsAt: now,
        endsAt: now + days * 86400000,
      });
      onLaunched();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed");
    }
  }

  return (
    <motion.div
      className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">Launch Offering</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs text-zinc-400 dark:text-zinc-500">Price per token (USDT)</label>
          <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400 dark:text-zinc-500">Total supply</label>
          <input type="number" min="1000" value={supply} onChange={(e) => setSupply(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400 dark:text-zinc-500">Raise target (USDT)</label>
          <input type="number" min="1" step="1" value={raiseTarget} onChange={(e) => setRaiseTarget(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400 dark:text-zinc-500">Max/account (USDT)</label>
          <input type="number" min="1" step="1" value={maxPerAccount} onChange={(e) => setMaxPerAccount(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400 dark:text-zinc-500">Duration (days)</label>
          <input type="number" min="1" value={daysOpen} onChange={(e) => setDaysOpen(e.target.value)} className={inputClass} />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <Button onClick={handleLaunch} disabled={launch.isPending} className="mt-3 w-full" size="sm">
        <Rocket className="mr-2 h-4 w-4" />
        {launch.isPending ? "Launching..." : "Launch Offering"}
      </Button>
    </motion.div>
  );
}

export default function AdminPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: creators, isLoading, refetch } = useAdminCreators();
  const approve = useApproveCreator({ onSuccess: () => refetch() });
  const reject = useRejectCreator({ onSuccess: () => refetch() });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />)}
      </div>
    );
  }

  const grouped = {
    pending: creators?.filter((c) => c.status === "pending") ?? [],
    approved: creators?.filter((c) => c.status === "approved") ?? [],
    live: creators?.filter((c) => c.status === "live") ?? [],
    rejected: creators?.filter((c) => c.status === "rejected") ?? [],
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="mb-2 text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-50">Admin</h1>
        <p className="mb-8 text-zinc-400 dark:text-zinc-500">Creator management dashboard</p>
      </motion.div>

      <motion.div className="mb-8 grid grid-cols-4 gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        {Object.entries(grouped).map(([status, list]) => (
          <div key={status} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-slate-900 p-4">
            <p className="text-xs capitalize text-zinc-400 dark:text-zinc-500">{status}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{list.length}</p>
          </div>
        ))}
      </motion.div>

      {(["pending", "approved", "live", "rejected"] as const).map((status) => {
        const list = grouped[status];
        if (list.length === 0) return null;
        return (
          <div key={status} className="mb-8">
            <h2 className="mb-4 text-lg font-semibold capitalize text-zinc-900 dark:text-zinc-50">{status}</h2>
            <div className="space-y-3">
              {list.map((creator) => {
                const isExpanded = expandedId === creator.creatorId;
                return (
                  <motion.div key={creator.creatorId} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-slate-900" layout>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime/30 font-bold text-zinc-900 dark:text-zinc-50">
                          {creator.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{creator.name}</p>
                          <p className="text-sm text-zinc-400 dark:text-zinc-500">/{creator.slug} &middot; {creator.category}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[creator.status ?? "pending"]}`}>
                          {creator.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {creator.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => approve.mutate({ creatorId: creator.creatorId })} disabled={approve.isPending} className="gap-1">
                              <CheckCircle className="h-4 w-4 text-emerald-600" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => reject.mutate({ creatorId: creator.creatorId })} disabled={reject.isPending} className="gap-1">
                              <XCircle className="h-4 w-4 text-red-500" /> Reject
                            </Button>
                          </>
                        )}
                        {creator.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => setExpandedId(isExpanded ? null : creator.creatorId)} className="gap-1">
                            <Rocket className="h-4 w-4" /> Launch Offering
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        )}
                        <button onClick={() => setExpandedId(isExpanded ? null : creator.creatorId)} className="ml-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-50 transition-colors">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="border-t border-zinc-100 dark:border-zinc-800/70 px-4 pb-4 pt-3 overflow-hidden"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            <div><p className="text-zinc-400 dark:text-zinc-500">Subscribers</p><p className="font-medium text-zinc-900 dark:text-zinc-50">{(creator.subscriberCount ?? 0).toLocaleString()}</p></div>
                            <div><p className="text-zinc-400 dark:text-zinc-500">Avg Views</p><p className="font-medium text-zinc-900 dark:text-zinc-50">{(creator.avgViews ?? 0).toLocaleString()}</p></div>
                            <div><p className="text-zinc-400 dark:text-zinc-500">Revenue/mo</p><p className="font-medium text-zinc-900 dark:text-zinc-50">${(creator.monthlyRevenue ?? 0).toLocaleString()}</p></div>
                            <div><p className="text-zinc-400 dark:text-zinc-500">Revenue Share</p><p className="font-medium text-zinc-900 dark:text-zinc-50">{((creator.revenueShareBps ?? 0) / 100).toFixed(1)}%</p></div>
                          </div>
                          {creator.youtubeUrl && (
                            <a href={creator.youtubeUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-50 underline">
                              {creator.youtubeUrl}
                            </a>
                          )}
                          {creator.status === "approved" && (
                            <LaunchOfferingForm creatorId={creator.creatorId} onLaunched={() => { setExpandedId(null); refetch(); }} />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!creators?.length && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-slate-900 px-6 py-16 text-center text-zinc-400 dark:text-zinc-500">
          No creator applications yet.
        </div>
      )}
    </div>
  );
}
