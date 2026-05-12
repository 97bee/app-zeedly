"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ExplorePage() {
  const { data: creators, isLoading } = trpc.creator.list.useQuery();

  return (
    <div>
      <motion.div
        className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Creator Hub</p>
          <h1 className="text-3xl font-black tracking-[-0.05em] text-slate-950">Explore Creators</h1>
          <p className="mt-2 text-sm text-slate-500">
            Discover and invest in the next generation of content creators
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
          {creators?.length ?? 0} live creators
        </span>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : !creators?.length ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
          No creators live yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator, i) => (
            <motion.a
              key={creator.slug}
              href={`/creator/${creator.slug}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <div className="relative h-40 bg-slate-950">
                {creator.artworkUrl || creator.avatarUrl ? (
                  <Image
                    src={creator.artworkUrl || creator.avatarUrl || ""}
                    alt={`${creator.name} artwork`}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(135deg,#0d0f14,#1e293b_60%,#475569)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                  Live
                </span>
              </div>

              <div className="p-5">
                <div className="-mt-12 mb-4 flex items-end justify-between gap-4">
                  {creator.avatarUrl ? (
                    <Image
                      src={creator.avatarUrl}
                      alt={creator.name}
                      width={60}
                      height={60}
                      unoptimized
                      className="h-[60px] w-[60px] rounded-2xl border-4 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl border-4 border-white bg-slate-950 text-xl font-black text-white shadow-sm">
                      {creator.name[0]}
                    </div>
                  )}
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors group-hover:border-slate-950 group-hover:text-slate-950">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                    {creator.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">{creator.category}</p>
                </div>

                <div className="my-4 flex flex-wrap gap-2">
                  {creator.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[11px] text-slate-400">Subscribers</p>
                    <p className="text-sm font-semibold text-slate-950">
                      {formatNumber(creator.subscriberCount ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Avg Views</p>
                    <p className="text-sm font-semibold text-slate-950">
                      {formatNumber(creator.avgViews ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Revenue/mo</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatUSD(creator.monthlyRevenue ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
