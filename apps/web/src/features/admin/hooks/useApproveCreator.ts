import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Input = Parameters<typeof trpcClient.admin.approveCreator.mutate>[0];
type Output = Awaited<
  ReturnType<typeof trpcClient.admin.approveCreator.mutate>
>;

type Options = Partial<
  Omit<UseMutationOptions<Output, Error, Input>, "mutationKey" | "mutationFn">
>;

export const useApproveCreator = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation<Output, Error, Input>({
    mutationKey: queryKeys.approveCreator(),
    mutationFn: (input) => trpcClient.admin.approveCreator.mutate(input),
    ...options,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.getAdminCreators(),
      });
      await options?.onSuccess?.(...args);
    },
  });
};
