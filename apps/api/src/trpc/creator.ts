import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import { CreatorEntity } from "../db/index.js";

export const creatorRouter = router({
  list: publicProcedure.query(async () => {
    const result = await CreatorEntity.query.byStatus({ status: "live" }).go();
    return result.data;
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const result = await CreatorEntity.query.bySlug({ slug: input.slug }).go();
      return result.data[0] ?? null;
    }),

  /**
   * Submit a creator application. Creates a creator record with status "pending".
   * An admin reviews and approves/rejects it.
   */
  submitApplication: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        slug: z
          .string()
          .min(2)
          .max(50)
          .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
        category: z.string().min(2).max(50),
        tags: z.array(z.string().min(1).max(30)).min(1).max(10),
        youtubeUrl: z.string().url(),
        subscriberCount: z.number().int().min(0).default(0),
        avgViews: z.number().int().min(0).default(0),
        monthlyRevenue: z.number().min(0).default(0),
        valuation: z.number().min(0).default(0),
        revenueShareBps: z.number().int().min(0).max(5000).default(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { nanoid } = await import("nanoid");

      // Check slug isn't taken
      const existing = await CreatorEntity.query.bySlug({ slug: input.slug }).go();
      if (existing.data.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "That username is already taken" });
      }

      const creatorId = nanoid();
      await CreatorEntity.create({
        creatorId,
        userId: ctx.userId,
        ...input,
        status: "pending",
      }).go();

      return { creatorId };
    }),
});
