import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Input = Parameters<typeof trpcClient.admin.rejectCreator.mutate>[0];
type Output = Awaited<
  ReturnType<typeof trpcClient.admin.rejectCreator.mutate>
>;

type Options = Partial<
  Omit<UseMutationOptions<Output, Error, Input>, "mutationKey" | "mutationFn">
>;

export const useRejectCreator = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation<Output, Error, Input>({
    mutationKey: queryKeys.rejectCreator(),
    mutationFn: (input) => trpcClient.admin.rejectCreator.mutate(input),
    ...options,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.getAdminCreators(),
      });
      await options?.onSuccess?.(...args);
    },
  });
};
