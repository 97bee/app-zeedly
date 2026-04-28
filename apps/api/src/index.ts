import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { handle } from "hono/aws-lambda";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/trpc.js";
import { env } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { tracer } from "./lib/tracer.js";
import { stripe } from "./stripe/index.js";
import { TransactionEntity } from "./db/index.js";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: [env.WEB_URL],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

/**
 * Stripe webhook — handles payment_intent.succeeded to confirm deposit transactions.
 * USDC transfer to user wallet happens here (stub for now; wire up OpenFort in Phase 3).
 */
app.post("/webhooks/stripe", async (c) => {
  if (!stripe) return c.json({ error: "Stripe not configured" }, 400);

  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ error: "Missing signature" }, 400);

  const rawBody = await c.req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", { err });
    return c.json({ error: "Invalid signature" }, 400);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const { txId } = pi.metadata as { txId?: string };
    if (txId) {
      await TransactionEntity.patch({ txId }).set({ status: "confirmed" }).go();
      // TODO Phase 3: transfer USDC to user's wallet via OpenFort
      logger.info("Deposit confirmed", { txId, amount: pi.amount });
    }
  }

  return c.json({ received: true });
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: async (opts) => createContext({ req: opts.req }),
  }),
);

// Lambda export — wrapped with Middy for structured logging and tracing
export const handler = middy(handle(app))
  .use(injectLambdaContext(logger, { clearState: true }))
  .use(captureLambdaHandler(tracer));

async function startLocalServer() {
  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    logger.info(`Zeedly API running on http://localhost:${info.port}`);
  });
}

// Local dev server (IS_LOCAL=true pnpm dev)
if (env.IS_LOCAL) {
  void startLocalServer();
}
