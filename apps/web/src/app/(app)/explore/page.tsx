"use client";

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explore Creators</h1>
        <p className="mt-2 text-zinc-400">
          Discover and invest in the next generation of content creators
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : !creators?.length ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-16 text-center text-zinc-500">
          No creators live yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <a
              key={creator.slug}
              href={`/creator/${creator.slug}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-emerald-500/50 hover:bg-zinc-800/50"
            >
              <div className="mb-4 flex items-center gap-4">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-xl font-bold">
                    {creator.name[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-emerald-400">
                    {creator.name}
                  </h3>
                  <p className="text-sm text-zinc-500">{creator.category}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {creator.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
                <div>
                  <p className="text-xs text-zinc-500">Subscribers</p>
                  <p className="text-sm font-semibold">
                    {formatNumber(creator.subscriberCount ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Avg Views</p>
                  <p className="text-sm font-semibold">
                    {formatNumber(creator.avgViews ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Revenue/mo</p>
                  <p className="text-sm font-semibold text-emerald-400">
                    {formatUSD(creator.monthlyRevenue ?? 0)}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
