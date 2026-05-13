import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Input = Parameters<typeof trpcClient.admin.launchIPO.mutate>[0];
type Output = Awaited<ReturnType<typeof trpcClient.admin.launchIPO.mutate>>;

export const useLaunchIpo = () =>
  useMutation<Output, Error, Input>({
    mutationKey: queryKeys.launchIpo(),
    mutationFn: (input) => trpcClient.admin.launchIPO.mutate(input),
  });
