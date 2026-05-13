import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Input = Parameters<typeof trpcClient.wallet.createDepositIntent.mutate>[0];
type Output = Awaited<
  ReturnType<typeof trpcClient.wallet.createDepositIntent.mutate>
>;

export const useCreateDepositIntent = () =>
  useMutation<Output, Error, Input>({
    mutationKey: queryKeys.createDepositIntent(),
    mutationFn: (input) => trpcClient.wallet.createDepositIntent.mutate(input),
  });
