"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  approved: "bg-blue-500/10 text-blue-400",
  live: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
};

function LaunchIPOForm({
  creatorId,
  onLaunched,
}: {
  creatorId: string;
  onLaunched: () => void;
}) {
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
      await launch.mutateAsync({
        creatorId,
        pricePerToken: priceVal,
        totalSupply: supplyVal,
        startsAt: now,
        endsAt: now + days * 24 * 60 * 60 * 1000,
      });
      onLaunched();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed");
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <p className="mb-3 text-sm font-medium text-zinc-300">Launch IPO</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Price per token ($)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Total supply</label>
          <input
            type="number"
            min="1000"
            value={supply}
            onChange={(e) => setSupply(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Duration (days)</label>
          <input
            type="number"
            min="1"
            value={daysOpen}
            onChange={(e) => setDaysOpen(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
      <Button
        onClick={handleLaunch}
        disabled={launch.isPending}
        className="mt-3 w-full"
        size="sm"
      >
        <Rocket className="mr-2 h-4 w-4" />
        {launch.isPending ? "Launching…" : "Launch IPO & Go Live"}
      </Button>
    </div>
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
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-900" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-900" />
        ))}
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
      <h1 className="mb-2 text-3xl font-bold">Admin</h1>
      <p className="mb-8 text-zinc-400">Creator management dashboard</p>

      {/* Summary counts */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        {Object.entries(grouped).map(([status, list]) => (
          <div key={status} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs capitalize text-zinc-500">{status}</p>
            <p className="text-2xl font-bold">{list.length}</p>
          </div>
        ))}
      </div>

      {/* Pending applications first */}
      {(["pending", "approved", "live", "rejected"] as const).map((status) => {
        const list = grouped[status];
        if (list.length === 0) return null;

        return (
          <div key={status} className="mb-8">
            <h2 className="mb-4 text-lg font-semibold capitalize">{status}</h2>
            <div className="space-y-3">
              {list.map((creator) => {
                const isExpanded = expandedId === creator.creatorId;

                return (
                  <div
                    key={creator.creatorId}
                    className="rounded-xl border border-zinc-800 bg-zinc-900"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 font-bold">
                          {creator.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold">{creator.name}</p>
                          <p className="text-sm text-zinc-500">
                            /{creator.slug} · {creator.category}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[creator.status ?? "pending"]}`}
                        >
                          {creator.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {creator.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approve.mutate({ creatorId: creator.creatorId })}
                              disabled={approve.isPending}
                              className="gap-1 border-emerald-700 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reject.mutate({ creatorId: creator.creatorId })}
                              disabled={reject.isPending}
                              className="gap-1 border-red-700 text-red-400 hover:bg-red-500/10"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}

                        {creator.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : creator.creatorId)
                            }
                            className="gap-1"
                          >
                            <Rocket className="h-4 w-4" />
                            Launch IPO
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        )}

                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : creator.creatorId)
                          }
                          className="ml-1 text-zinc-500 hover:text-white"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div>
                            <p className="text-zinc-500">Subscribers</p>
                            <p className="font-medium">
                              {(creator.subscriberCount ?? 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Avg Views</p>
                            <p className="font-medium">
                              {(creator.avgViews ?? 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Revenue/mo</p>
                            <p className="font-medium">${(creator.monthlyRevenue ?? 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Revenue Share</p>
                            <p className="font-medium">
                              {((creator.revenueShareBps ?? 0) / 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        {creator.youtubeUrl && (
                          <a
                            href={creator.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 block text-sm text-zinc-400 hover:text-white underline"
                          >
                            {creator.youtubeUrl}
                          </a>
                        )}

                        {creator.status === "approved" && (
                          <LaunchIPOForm
                            creatorId={creator.creatorId}
                            onLaunched={() => {
                              setExpandedId(null);
                              refetch();
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!creators?.length && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-16 text-center text-zinc-500">
          No creator applications yet.
        </div>
      )}
    </div>
  );
}
