import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type DepositQuote = Awaited<
  ReturnType<typeof trpcClient.wallet.quoteDeposit.query>
>;

type Currency = "GBP" | "USD" | "EUR";

export const useDepositQuote = (
  amount: number,
  currency: Currency,
  enabled = true,
) =>
  useQuery<DepositQuote, Error>({
    queryKey: queryKeys.getDepositQuote(amount, currency),
    queryFn: () => trpcClient.wallet.quoteDeposit.query({ amount, currency }),
    enabled: enabled && amount >= 10 && amount <= 10000,
  });
