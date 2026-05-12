// OpenFort server SDK
// Docs: https://www.openfort.io/docs/products/server

import Openfort from "@openfort/openfort-node";
import { env } from "../lib/config.js";
import { logger } from "../lib/logger.js";

// Singleton client — used for wallet operations, gas sponsorship, etc.
export const openfortClient = new Openfort(env.OPENFORT_SECRET_KEY, {
  publishableKey: env.OPENFORT_PUBLISHABLE_KEY,
});

/**
 * Verify an OpenFort access token and return the user identity.
 * Called on every authenticated tRPC request.
 */
export async function verifyOpenfortToken(
  token: string,
): Promise<{ openfortUserId: string; email: string } | null> {
  const tokensToTry = [token];
  const decodedToken = decodeToken(token);
  if (decodedToken !== token) {
    tokensToTry.push(decodedToken);
  }

  for (const candidate of tokensToTry) {
    try {
      const result = await openfortClient.iam.getSession({ accessToken: candidate });
      return {
        openfortUserId: result.user.id,
        email: result.user.email,
      };
    } catch (error) {
      logger.warn("OpenFort token validation failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
        triedDecodedToken: candidate !== token,
        hasPublishableKey: Boolean(env.OPENFORT_PUBLISHABLE_KEY),
      });
    }
  }

  return null;
}

function decodeToken(token: string) {
  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}
