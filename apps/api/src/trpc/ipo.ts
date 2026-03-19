import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import { IPOEntity, IPOPurchaseEntity, TransactionEntity, CreatorEntity } from "../db/index.js";

export const ipoRouter = router({
  /**
   * List all active + upcoming IPOs, enriched with creator name/category/slug.
   */
  list: publicProcedure.query(async () => {
    const [active, upcoming] = await Promise.all([
      IPOEntity.query.byStatus({ status: "active" }).go(),
      IPOEntity.query.byStatus({ status: "upcoming" }).go(),
    ]);
    const ipos = [...active.data, ...upcoming.data];

    if (ipos.length === 0) return [];

    const creatorIds = [...new Set(ipos.map((i) => i.creatorId))];
    const creators = await Promise.all(
      creatorIds.map((id) => CreatorEntity.query.byCreatorId({ creatorId: id }).go()),
    );
    const creatorMap = new Map(creators.flatMap((r) => r.data.map((c) => [c.creatorId, c])));

    return ipos.map((ipo) => ({ ...ipo, creator: creatorMap.get(ipo.creatorId) ?? null }));
  }),

  /**
   * Get IPOs for a specific creator (used on creator detail page).
   */
  getByCreator: publicProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ input }) => {
      const result = await IPOEntity.query.byCreator({ creatorId: input.creatorId }).go();
      return result.data;
    }),

  /**
   * Purchase tokens in an active IPO.
   * Records a pending IPOPurchase + Transaction.
   * Actual USDC deduction and token credit happen once Anchor programs are live (Phase 4).
   */
  purchase: protectedProcedure
    .input(
      z.object({
        ipoId: z.string(),
        quantity: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { nanoid } = await import("nanoid");

      const ipoResult = await IPOEntity.query.byIpoId({ ipoId: input.ipoId }).go();
      const ipo = ipoResult.data[0];
      if (!ipo) throw new TRPCError({ code: "NOT_FOUND", message: "IPO not found" });
      if (ipo.status !== "active")
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "IPO is not active" });

      const sold = ipo.sold ?? 0;
      const raisedUsd = ipo.raisedUsd ?? 0;
      const remaining = ipo.totalSupply - sold;
      if (input.quantity > remaining)
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Not enough tokens remaining" });

      const usdAmount = input.quantity * ipo.pricePerToken;
      const purchaseId = nanoid();
      const txId = nanoid();

      await Promise.all([
        IPOPurchaseEntity.create({
          purchaseId,
          ipoId: input.ipoId,
          userId: ctx.userId,
          quantity: input.quantity,
          usdAmount,
          status: "pending",
        }).go(),
        TransactionEntity.create({
          txId,
          userId: ctx.userId,
          type: "ipo_purchase",
          amount: usdAmount,
          referenceId: purchaseId,
          status: "pending",
        }).go(),
        IPOEntity.patch({ ipoId: input.ipoId })
          .set({ sold: sold + input.quantity, raisedUsd: raisedUsd + usdAmount })
          .go(),
      ]);

      return { purchaseId, txId, usdAmount };
    }),
});
