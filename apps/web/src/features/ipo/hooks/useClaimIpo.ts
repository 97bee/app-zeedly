import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Input = Parameters<typeof trpcClient.ipo.claim.mutate>[0];
type Output = Awaited<ReturnType<typeof trpcClient.ipo.claim.mutate>>;

type Options = Partial<
  Omit<UseMutationOptions<Output, Error, Input>, "mutationKey" | "mutationFn">
>;

export const useClaimIpo = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation<Output, Error, Input>({
    mutationKey: queryKeys.claimIpo(),
    mutationFn: (input) => trpcClient.ipo.claim.mutate(input),
    ...options,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.getPortfolioHoldings(),
      });
      await options?.onSuccess?.(...args);
    },
  });
};
