import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { queryKeys } from "@/config/queryKeys";

export type Creator = Awaited<
  ReturnType<typeof trpcClient.creator.getBySlug.query>
>;

export const useCreator = (slug: string | undefined) =>
  useQuery<Creator, Error>({
    queryKey: queryKeys.getCreator(slug ?? ""),
    queryFn: () => trpcClient.creator.getBySlug.query({ slug: slug ?? "" }),
    enabled: !!slug,
  });
