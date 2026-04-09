"use client";

import { motion } from "framer-motion";
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
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold font-serif text-zinc-900">Explore Creators</h1>
        <p className="mt-2 text-zinc-500">
          Discover and invest in the next generation of content creators
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : !creators?.length ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center text-zinc-500">
          No creators live yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator, i) => (
            <motion.a
              key={creator.slug}
              href={`/creator/${creator.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <div className="mb-4 flex items-center gap-4">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime/30 text-xl font-bold text-zinc-900">
                    {creator.name[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700">
                    {creator.name}
                  </h3>
                  <p className="text-sm text-zinc-400">{creator.category}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {creator.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4">
                <div>
                  <p className="text-xs text-zinc-400">Subscribers</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatNumber(creator.subscriberCount ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Avg Views</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatNumber(creator.avgViews ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Revenue/mo</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatUSD(creator.monthlyRevenue ?? 0)}
                  </p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
