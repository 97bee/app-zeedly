import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type WalletTransactions = Awaited<
  ReturnType<typeof trpcClient.wallet.transactions.query>
>;

export const useWalletTransactions = (limit?: number) =>
  useQuery<WalletTransactions, Error>({
    queryKey: queryKeys.getWalletTransactions(limit),
    queryFn: () =>
      trpcClient.wallet.transactions.query(limit ? { limit } : undefined),
  });
