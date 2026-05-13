import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Input = Parameters<typeof trpcClient.ipo.purchase.mutate>[0];
type Output = Awaited<ReturnType<typeof trpcClient.ipo.purchase.mutate>>;

export const usePurchaseIpo = () =>
  useMutation<Output, Error, Input>({
    mutationKey: queryKeys.purchaseIpo(),
    mutationFn: (input) => trpcClient.ipo.purchase.mutate(input),
  });
