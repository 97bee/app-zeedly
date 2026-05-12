"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../api/src/trpc/router.js";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, Clock, ExternalLink, Rocket, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Offering = RouterOutputs["ipo"]["list"][number];

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatUsdt(amount: number): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)} USDT`;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(ts));
}

function offeringLabel(status?: string) {
  if (status === "active") return "Live";
  if (status === "closed") return "Completed";
  return "Coming soon";
}

function statusClass(status?: string) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "closed") return "bg-zinc-100 text-zinc-600";
  return "bg-amber-50 text-amber-700";
}

function getRaiseTarget(offering: Offering) {
  return offering.raiseTargetUsd || offering.totalSupply * offering.pricePerToken;
}

function getAccountMax(offering: Offering) {
  return offering.maxInvestmentPerAccountUsd || getRaiseTarget(offering);
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
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl"
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Invest in {offering.creator?.name}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-500">Lock from available USDT balance</label>
            <input
              type="number"
              min={offering.pricePerToken}
              max={Math.min(remaining * offering.pricePerToken, remainingRaiseUsd, accountMax)}
              step="1"
              value={amountStr}
              onChange={(event) => setAmountStr(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-lg text-zinc-900 placeholder-zinc-400 transition-all focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Available: {formatUsdt(available)} / {formatUsdt(remainingRaiseUsd)} left / Max {formatUsdt(accountMax)}
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Estimated tokens</span>
              <span className="font-medium text-zinc-900">{quantity.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-zinc-500">USDT to lock</span>
              <span className="font-medium text-zinc-900">{formatUsdt(spend)}</span>
            </div>
            <p className="mt-3 border-t border-zinc-200 pt-3 text-xs text-zinc-500">
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

export default function OfferingsPage() {
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());
  const { data: offerings, isLoading, refetch } = trpc.ipo.list.useQuery();
  const selectedOffering = offerings?.find((offering) => offering.ipoId === selectedOfferingId);

  const sections = [
    { title: "Live", status: "active" as const, empty: "No live offerings right now." },
    { title: "Coming Soon", status: "upcoming" as const, empty: "No upcoming offerings announced yet." },
    { title: "Completed", status: "closed" as const, empty: "No completed offerings yet." },
  ];

  return (
    <div>
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold font-serif text-zinc-900">Creator Offerings</h1>
        <p className="mt-2 text-zinc-500">
          Upcoming launches, live offerings, and completed creator tokens in one place.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-9">
          {sections.map((section) => {
            const items = offerings?.filter((offering) => offering.status === section.status) ?? [];
            return (
              <section key={section.status}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-zinc-900">{section.title}</h2>
                  <span className="text-sm text-zinc-400">{items.length} offerings</span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-10 text-center text-sm text-zinc-400">
                    {section.empty}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {items.map((offering, i) => {
                      const creator = offering.creator;
                      const target = getRaiseTarget(offering);
                      const accountMax = getAccountMax(offering);
                      const raised = offering.raisedUsd ?? 0;
                      const percentSold = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
                      const monthlyDividend =
                        creator?.estimatedMonthlyDividend ||
                        ((creator?.monthlyRevenue ?? 0) * ((creator?.revenueShareBps ?? 0) / 10000));
                      const isNotified = notified.has(offering.ipoId);

                      return (
                        <motion.div
                          key={offering.ipoId}
                          className="rounded-2xl border border-zinc-200 bg-white p-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.04 }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-4">
                              {creator?.avatarUrl ? (
                                <Image
                                  src={creator.avatarUrl}
                                  alt={creator.name}
                                  width={56}
                                  height={56}
                                  unoptimized
                                  className="h-14 w-14 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lime/30 text-xl font-bold text-zinc-900">
                                  {creator?.name?.[0] ?? "?"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h3 className="truncate text-xl font-semibold text-zinc-900">
                                  {creator?.name ?? "Unknown Creator"}
                                </h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(offering.status)}`}>
                                    {offeringLabel(offering.status)}
                                  </span>
                                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                                    {creator?.genre ?? creator?.category ?? "Creator"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {creator?.youtubeUrl ? (
                              <a
                                href={creator.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden shrink-0 items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 md:flex"
                              >
                                Channel <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>

                          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                            <div>
                              <p className="text-xs text-zinc-400">Subscribers</p>
                              <p className="text-lg font-semibold text-zinc-900">
                                {formatNumber(creator?.subscriberCount ?? 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400">
                                {offering.status === "closed" ? "Raised At" : "Valuation"}
                              </p>
                              <p className="text-lg font-semibold text-zinc-900">
                                {formatUsdt(offering.valuationAtRaise || creator?.valuation || target)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400">Raise Target</p>
                              <p className="text-lg font-semibold text-zinc-900">{formatUsdt(target)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400">Max / Account</p>
                              <p className="text-lg font-semibold text-zinc-900">{formatUsdt(accountMax)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-400">Est. Monthly Payout</p>
                              <p className="text-lg font-semibold text-emerald-600">
                                {formatUsdt(monthlyDividend)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6">
                            <div className="mb-2 flex justify-between text-sm">
                              <span className="text-zinc-500">{formatUsdt(raised)} raised</span>
                              <span className="text-zinc-400">{percentSold}% funded</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-zinc-100">
                              <div className="h-full rounded-full bg-lime" style={{ width: `${percentSold}%` }} />
                            </div>
                          </div>

                          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              {offering.status === "active" ? (
                                <Rocket className="h-4 w-4" />
                              ) : offering.status === "closed" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                              {offering.status === "active"
                                ? `Ends ${formatDate(offering.endsAt)}`
                                : offering.status === "closed"
                                  ? `Completed ${formatDate(offering.endsAt)}`
                                  : `Starts ${formatDate(offering.startsAt)}`}
                            </div>

                            <div className="flex items-center gap-3">
                              {creator?.slug ? (
                                <Button asChild variant="outline">
                                  <Link href={`/creator/${creator.slug}`}>Details</Link>
                                </Button>
                              ) : null}
                              {offering.status === "active" ? (
                                <Button onClick={() => setSelectedOfferingId(offering.ipoId)}>
                                  <Rocket className="h-4 w-4" />
                                  Invest
                                </Button>
                              ) : offering.status === "closed" && creator?.slug ? (
                                <Button asChild>
                                  <Link href={`/creator/${creator.slug}`}>Buy</Link>
                                </Button>
                              ) : (
                                <Button
                                  variant={isNotified ? "secondary" : "default"}
                                  onClick={() =>
                                    setNotified((current) => new Set(current).add(offering.ipoId))
                                  }
                                >
                                  <Bell className="h-4 w-4" />
                                  {isNotified ? "Notification Set" : "Notify Me"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
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
