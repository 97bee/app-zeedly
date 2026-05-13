import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type Creators = Awaited<
  ReturnType<typeof trpcClient.creator.list.query>
>;

export const useCreators = () =>
  useQuery<Creators, Error>({
    queryKey: queryKeys.getCreators(),
    queryFn: () => trpcClient.creator.list.query(),
  });
