import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type PortfolioHoldings = Awaited<
  ReturnType<typeof trpcClient.portfolio.getHoldings.query>
>;

export const usePortfolioHoldings = () =>
  useQuery<PortfolioHoldings, Error>({
    queryKey: queryKeys.getPortfolioHoldings(),
    queryFn: () => trpcClient.portfolio.getHoldings.query(),
  });
