"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  live: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20 transition-all";

function LaunchIPOForm({ creatorId, onLaunched }: { creatorId: string; onLaunched: () => void }) {
  const [price, setPrice] = useState("1.00");
  const [supply, setSupply] = useState("1000000");
  const [daysOpen, setDaysOpen] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const launch = trpc.admin.launchIPO.useMutation();

  async function handleLaunch() {
    const priceVal = parseFloat(price);
    const supplyVal = parseInt(supply, 10);
    const days = parseInt(daysOpen, 10);
    if (isNaN(priceVal) || priceVal <= 0) { setError("Invalid price"); return; }
    if (isNaN(supplyVal) || supplyVal < 1000) { setError("Min supply 1,000"); return; }
    if (isNaN(days) || days < 1) { setError("Invalid duration"); return; }
    const now = Date.now();
    setError(null);
    try {
      await launch.mutateAsync({ creatorId, pricePerToken: priceVal, totalSupply: supplyVal, startsAt: now, endsAt: now + days * 86400000 });
      onLaunched();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed");
    }
  }

  return (
    <motion.div
      className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <p className="mb-3 text-sm font-medium text-zinc-700">Launch IPO</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Price per token ($)</label>
          <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Total supply</label>
          <input type="number" min="1000" value={supply} onChange={(e) => setSupply(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Duration (days)</label>
          <input type="number" min="1" value={daysOpen} onChange={(e) => setDaysOpen(e.target.value)} className={inputClass} />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <Button onClick={handleLaunch} disabled={launch.isPending} className="mt-3 w-full" size="sm">
        <Rocket className="mr-2 h-4 w-4" />
        {launch.isPending ? "Launching..." : "Launch IPO & Go Live"}
      </Button>
    </motion.div>
  );
}

export default function AdminPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: creators, isLoading, refetch } = trpc.admin.listCreators.useQuery();
  const approve = trpc.admin.approveCreator.useMutation({ onSuccess: () => refetch() });
  const reject = trpc.admin.rejectCreator.useMutation({ onSuccess: () => refetch() });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />)}
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
        <h1 className="mb-2 text-3xl font-bold font-serif text-zinc-900">Admin</h1>
        <p className="mb-8 text-zinc-400">Creator management dashboard</p>
      </motion.div>

      <motion.div className="mb-8 grid grid-cols-4 gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        {Object.entries(grouped).map(([status, list]) => (
          <div key={status} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs capitalize text-zinc-400">{status}</p>
            <p className="text-2xl font-bold text-zinc-900">{list.length}</p>
          </div>
        ))}
      </motion.div>

      {(["pending", "approved", "live", "rejected"] as const).map((status) => {
        const list = grouped[status];
        if (list.length === 0) return null;
        return (
          <div key={status} className="mb-8">
            <h2 className="mb-4 text-lg font-semibold capitalize text-zinc-900">{status}</h2>
            <div className="space-y-3">
              {list.map((creator) => {
                const isExpanded = expandedId === creator.creatorId;
                return (
                  <motion.div key={creator.creatorId} className="rounded-2xl border border-zinc-200 bg-white" layout>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime/30 font-bold text-zinc-900">
                          {creator.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">{creator.name}</p>
                          <p className="text-sm text-zinc-400">/{creator.slug} &middot; {creator.category}</p>
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
                            <Rocket className="h-4 w-4" /> Launch IPO
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        )}
                        <button onClick={() => setExpandedId(isExpanded ? null : creator.creatorId)} className="ml-1 text-zinc-400 hover:text-zinc-900 transition-colors">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="border-t border-zinc-100 px-4 pb-4 pt-3 overflow-hidden"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            <div><p className="text-zinc-400">Subscribers</p><p className="font-medium text-zinc-900">{(creator.subscriberCount ?? 0).toLocaleString()}</p></div>
                            <div><p className="text-zinc-400">Avg Views</p><p className="font-medium text-zinc-900">{(creator.avgViews ?? 0).toLocaleString()}</p></div>
                            <div><p className="text-zinc-400">Revenue/mo</p><p className="font-medium text-zinc-900">${(creator.monthlyRevenue ?? 0).toLocaleString()}</p></div>
                            <div><p className="text-zinc-400">Revenue Share</p><p className="font-medium text-zinc-900">{((creator.revenueShareBps ?? 0) / 100).toFixed(1)}%</p></div>
                          </div>
                          {creator.youtubeUrl && (
                            <a href={creator.youtubeUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-sm text-zinc-400 hover:text-zinc-900 underline">
                              {creator.youtubeUrl}
                            </a>
                          )}
                          {creator.status === "approved" && (
                            <LaunchIPOForm creatorId={creator.creatorId} onLaunched={() => { setExpandedId(null); refetch(); }} />
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
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center text-zinc-400">
          No creator applications yet.
        </div>
      )}
    </div>
  );
}
