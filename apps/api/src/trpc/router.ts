import { router } from "./trpc.js";
import { authRouter } from "./auth.js";
import { creatorRouter } from "./creator.js";
import { ipoRouter } from "./ipo.js";
import { tradeRouter } from "./trade.js";
import { portfolioRouter } from "./portfolio.js";
import { walletRouter } from "./wallet.js";
import { adminRouter } from "./admin.js";

export const appRouter = router({
  auth: authRouter,
  creator: creatorRouter,
  ipo: ipoRouter,
  trade: tradeRouter,
  portfolio: portfolioRouter,
  wallet: walletRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
