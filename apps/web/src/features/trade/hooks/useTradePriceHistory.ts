import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type PriceHistory = Awaited<
  ReturnType<typeof trpcClient.trade.priceHistory.query>
>;

/**
 * Per-creator price-history sparkline source. Each call goes through the
 * tRPC httpBatchLink so calling this in N rows fans down into a single HTTP
 * request.
 */
export const useTradePriceHistory = (
  creatorId: string | undefined,
  limit = 30,
) =>
  useQuery<PriceHistory, Error>({
    queryKey: [
      ...queryKeys.getTradePrice(creatorId ?? ""),
      "history",
      limit,
    ] as const,
    queryFn: () =>
      trpcClient.trade.priceHistory.query({
        creatorId: creatorId ?? "",
        limit,
      }),
    enabled: !!creatorId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
