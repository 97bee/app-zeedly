"use client";

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../api/src/trpc/router.js";
import { env } from "@/lib/env";
import { useAuthStore } from "@/store/auth";

// Vanilla tRPC client. Used as the queryFn/mutationFn source from the
// feature hooks under src/features. Cache keys live in src/config/queryKeys.ts.
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: env.NEXT_PUBLIC_API_URL,
      transformer: superjson,
      headers: () => {
        const token = useAuthStore.getState().token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

export type TrpcClient = typeof trpcClient;
