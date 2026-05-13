import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type TradePrice = Awaited<
  ReturnType<typeof trpcClient.trade.price.query>
>;

type Options = Partial<
  Omit<UseQueryOptions<TradePrice, Error>, "queryKey" | "queryFn">
>;

export const useTradePrice = (
  creatorId: string | undefined,
  options?: Options,
) =>
  useQuery<TradePrice, Error>({
    queryKey: queryKeys.getTradePrice(creatorId ?? ""),
    queryFn: () =>
      trpcClient.trade.price.query({ creatorId: creatorId ?? "" }),
    enabled: !!creatorId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  });
