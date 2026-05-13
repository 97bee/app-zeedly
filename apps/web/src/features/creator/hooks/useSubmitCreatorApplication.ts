import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Input = Parameters<
  typeof trpcClient.creator.submitApplication.mutate
>[0];
type Output = Awaited<
  ReturnType<typeof trpcClient.creator.submitApplication.mutate>
>;

export const useSubmitCreatorApplication = () =>
  useMutation<Output, Error, Input>({
    mutationKey: queryKeys.submitCreatorApplication(),
    mutationFn: (input) =>
      trpcClient.creator.submitApplication.mutate(input),
  });
