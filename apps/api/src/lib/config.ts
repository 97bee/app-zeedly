import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  IS_LOCAL: z.string().optional(),
  AWS_REGION: z.string().default("eu-west-1"),
  DYNAMODB_TABLE: z.string().default("zeedly"),
  DYNAMODB_ENDPOINT: z.string().optional(), // for local DynamoDB (docker)
  OPENFORT_SECRET_KEY: z.string().default("sk_test_placeholder"),
  OPENFORT_SHIELD_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SOLANA_RPC_URL: z.string().default("https://api.devnet.solana.com"),
  WEB_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
