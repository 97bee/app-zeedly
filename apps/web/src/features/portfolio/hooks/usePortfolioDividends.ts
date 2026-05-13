import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type PortfolioDividends = Awaited<
  ReturnType<typeof trpcClient.portfolio.dividends.query>
>;

export const usePortfolioDividends = () =>
  useQuery<PortfolioDividends, Error>({
    queryKey: queryKeys.getPortfolioDividends(),
    queryFn: () => trpcClient.portfolio.dividends.query(),
  });
