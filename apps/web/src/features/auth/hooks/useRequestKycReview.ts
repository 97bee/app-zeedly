import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

type Output = Awaited<
  ReturnType<typeof trpcClient.auth.requestKycReview.mutate>
>;

type Options = Partial<
  Omit<UseMutationOptions<Output, Error, void>, "mutationKey" | "mutationFn">
>;

export const useRequestKycReview = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation<Output, Error, void>({
    mutationKey: queryKeys.requestKycReview(),
    mutationFn: () => trpcClient.auth.requestKycReview.mutate(),
    ...options,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.getMe() });
      await options?.onSuccess?.(...args);
    },
  });
};
