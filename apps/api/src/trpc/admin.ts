import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./trpc.js";
import { CreatorEntity, IPOEntity } from "../db/index.js";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * List all creators regardless of status.
   */
  listCreators: adminProcedure.query(async () => {
    const [pending, approved, live, rejected] = await Promise.all([
      CreatorEntity.query.byStatus({ status: "pending" }).go(),
      CreatorEntity.query.byStatus({ status: "approved" }).go(),
      CreatorEntity.query.byStatus({ status: "live" }).go(),
      CreatorEntity.query.byStatus({ status: "rejected" }).go(),
    ]);
    return [...pending.data, ...approved.data, ...live.data, ...rejected.data];
  }),

  approveCreator: adminProcedure
    .input(z.object({ creatorId: z.string() }))
    .mutation(async ({ input }) => {
      await CreatorEntity.patch({ creatorId: input.creatorId }).set({ status: "approved" }).go();
      return { success: true };
    }),

  rejectCreator: adminProcedure
    .input(z.object({ creatorId: z.string() }))
    .mutation(async ({ input }) => {
      await CreatorEntity.patch({ creatorId: input.creatorId }).set({ status: "rejected" }).go();
      return { success: true };
    }),

  /**
   * Promote a creator to "live" and open their IPO simultaneously.
   */
  launchIPO: adminProcedure
    .input(
      z.object({
        creatorId: z.string(),
        pricePerToken: z.number().min(0.01),
        totalSupply: z.number().int().min(1000),
        startsAt: z.number(), // epoch ms
        endsAt: z.number(),   // epoch ms
      }),
    )
    .mutation(async ({ input }) => {
      const { nanoid } = await import("nanoid");
      const ipoId = nanoid();

      await Promise.all([
        CreatorEntity.patch({ creatorId: input.creatorId }).set({ status: "live" }).go(),
        IPOEntity.create({
          ipoId,
          creatorId: input.creatorId,
          pricePerToken: input.pricePerToken,
          totalSupply: input.totalSupply,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: "active",
        }).go(),
      ]);

      return { ipoId };
    }),
});
