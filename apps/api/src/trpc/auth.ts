import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import { UserEntity } from "../db/index.js";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return null;
    const result = await UserEntity.query.byUserId({ userId: ctx.userId }).go();
    const user = result.data[0];
    if (!user) return null;
    return user;
  }),
});
