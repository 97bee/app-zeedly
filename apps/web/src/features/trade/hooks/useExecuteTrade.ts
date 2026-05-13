import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Input = Parameters<typeof trpcClient.trade.execute.mutate>[0];
type Output = Awaited<ReturnType<typeof trpcClient.trade.execute.mutate>>;

export const useExecuteTrade = () =>
  useMutation<Output, Error, Input>({
    mutationKey: queryKeys.executeTrade(),
    mutationFn: (input) => trpcClient.trade.execute.mutate(input),
  });
