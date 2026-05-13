import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type WalletBalance = Awaited<
  ReturnType<typeof trpcClient.wallet.balance.query>
>;

type Options = Partial<
  Omit<UseQueryOptions<WalletBalance, Error>, "queryKey" | "queryFn">
>;

export const useWalletBalance = (options?: Options) =>
  useQuery<WalletBalance, Error>({
    queryKey: queryKeys.getWalletBalance(),
    queryFn: () => trpcClient.wallet.balance.query(),
    ...options,
  });
