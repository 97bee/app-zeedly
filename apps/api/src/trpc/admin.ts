import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./trpc.js";
import { CreatorEntity, IPOEntity, UserEntity } from "../db/index.js";

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

  setUserKycStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        kycStatus: z.enum(["not_started", "pending", "verified", "rejected"]),
      }),
    )
    .mutation(async ({ input }) => {
      await UserEntity.patch({ userId: input.userId })
        .set({ kycStatus: input.kycStatus, kycUpdatedAt: Date.now() })
        .go();
      return { success: true };
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
        raiseTargetUsd: z.number().min(1).optional(),
        maxInvestmentPerAccountUsd: z.number().min(1).optional(),
        startsAt: z.number(), // epoch ms
        endsAt: z.number(),   // epoch ms
      }),
    )
    .mutation(async ({ input }) => {
      const { nanoid } = await import("nanoid");
      const ipoId = nanoid();
      const maxRaiseBySupply = input.pricePerToken * input.totalSupply;
      const raiseTargetUsd = input.raiseTargetUsd ?? maxRaiseBySupply;
      const maxInvestmentPerAccountUsd = input.maxInvestmentPerAccountUsd ?? raiseTargetUsd;
      const tokensNeededForTarget = raiseTargetUsd / input.pricePerToken;

      if (raiseTargetUsd > maxRaiseBySupply) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Raise target cannot exceed total supply multiplied by token price",
        });
      }
      if (Math.abs(tokensNeededForTarget - Math.round(tokensNeededForTarget)) > 0.000001) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Raise target must equal a whole number of tokens at this price",
        });
      }
      if (maxInvestmentPerAccountUsd < input.pricePerToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Max per account must be at least one token",
        });
      }
      if (maxInvestmentPerAccountUsd > raiseTargetUsd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Max per account cannot exceed the raise target",
        });
      }

      await Promise.all([
        CreatorEntity.patch({ creatorId: input.creatorId }).set({ status: "live" }).go(),
        IPOEntity.create({
          ipoId,
          creatorId: input.creatorId,
          pricePerToken: input.pricePerToken,
          totalSupply: input.totalSupply,
          raiseTargetUsd,
          maxInvestmentPerAccountUsd,
          valuationAtRaise: input.pricePerToken * input.totalSupply,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: "active",
        }).go(),
      ]);

      return { ipoId };
    }),
});
