import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type AdminCreators = Awaited<
  ReturnType<typeof trpcClient.admin.listCreators.query>
>;

export const useAdminCreators = () =>
  useQuery<AdminCreators, Error>({
    queryKey: queryKeys.getAdminCreators(),
    queryFn: () => trpcClient.admin.listCreators.query(),
  });
