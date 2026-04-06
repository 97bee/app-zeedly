import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { nanoid } from "nanoid";
import { verifyOpenfortToken } from "../openfort/index.js";
import { UserEntity } from "../db/index.js";

export interface Context {
  [key: string]: unknown;
  userId: string | null;
  email: string | null;
  role: "user" | "creator" | "admin" | null;
}

export async function createContext(opts: { req: Request }): Promise<Context> {
  const auth = opts.req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { userId: null, email: null, role: null };

  const payload = await verifyOpenfortToken(token);
  if (!payload) return { userId: null, email: null, role: null };

  // Look up user by OpenFort ID; create on first request after signup
  const existing = await UserEntity.query.byOpenfortId({ openfortUserId: payload.openfortUserId }).go();
  let user = existing.data[0];

  if (!user) {
    const userId = nanoid();
    const created = await UserEntity.create({
      userId,
      email: payload.email,
      role: "user",
      openfortUserId: payload.openfortUserId,
    }).go();
    user = created.data;
  }

  return {
    userId: user.userId,
    email: user.email,
    role: (user.role ?? "user") as "user" | "creator" | "admin",
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
