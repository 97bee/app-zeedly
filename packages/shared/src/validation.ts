import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const depositSchema = z.object({
  amount: z.number().positive().min(1),
});

export const tradeSchema = z.object({
  creatorId: z.string().uuid(),
  side: z.enum(["buy", "sell"]),
  usdAmount: z.number().positive(),
});

export const ipoPurchaseSchema = z.object({
  ipoId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const creatorApplicationSchema = z.object({
  name: z.string().min(1).max(100),
  youtubeUrl: z.string().url(),
  category: z.string().min(1),
  tags: z.array(z.string()).min(1).max(10),
});
