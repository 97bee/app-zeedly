import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type MyTrades = Awaited<
  ReturnType<typeof trpcClient.trade.myTrades.query>
>;

export const useMyTrades = (limit?: number) =>
  useQuery<MyTrades, Error>({
    queryKey: queryKeys.getMyTrades(limit),
    queryFn: () =>
      trpcClient.trade.myTrades.query(limit ? { limit } : undefined),
  });
