import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type Me = Awaited<ReturnType<typeof trpcClient.auth.me.query>>;

export const useMe = () =>
  useQuery<Me, Error>({
    queryKey: queryKeys.getMe(),
    queryFn: () => trpcClient.auth.me.query(),
  });
