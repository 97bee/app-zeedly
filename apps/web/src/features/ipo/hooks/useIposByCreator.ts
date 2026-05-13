import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type IposByCreator = Awaited<
  ReturnType<typeof trpcClient.ipo.getByCreator.query>
>;

export const useIposByCreator = (creatorId: string | undefined) =>
  useQuery<IposByCreator, Error>({
    queryKey: queryKeys.getIposByCreator(creatorId ?? ""),
    queryFn: () =>
      trpcClient.ipo.getByCreator.query({ creatorId: creatorId ?? "" }),
    enabled: !!creatorId,
  });
