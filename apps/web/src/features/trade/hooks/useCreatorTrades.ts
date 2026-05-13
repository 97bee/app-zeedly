import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type CreatorTrades = Awaited<
  ReturnType<typeof trpcClient.trade.creatorTrades.query>
>;

type Options = Partial<
  Omit<UseQueryOptions<CreatorTrades, Error>, "queryKey" | "queryFn">
>;

export const useCreatorTrades = (
  creatorId: string | undefined,
  limit?: number,
  options?: Options,
) =>
  useQuery<CreatorTrades, Error>({
    queryKey: queryKeys.getCreatorTrades(creatorId ?? "", limit),
    queryFn: () =>
      trpcClient.trade.creatorTrades.query({
        creatorId: creatorId ?? "",
        ...(limit ? { limit } : {}),
      }),
    enabled: !!creatorId,
    ...options,
  });
