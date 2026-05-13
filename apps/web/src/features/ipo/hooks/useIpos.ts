import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type Ipos = Awaited<ReturnType<typeof trpcClient.ipo.list.query>>;

export const useIpos = () =>
  useQuery<Ipos, Error>({
    queryKey: queryKeys.getIpos(),
    queryFn: () => trpcClient.ipo.list.query(),
  });
