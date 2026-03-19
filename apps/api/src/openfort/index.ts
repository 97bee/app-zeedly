// OpenFort server SDK
// Docs: https://www.openfort.io/docs/products/server

import Openfort from "@openfort/openfort-node";
import { env } from "../lib/config.js";

// Singleton client — used for wallet operations, gas sponsorship, etc.
export const openfortClient = new Openfort(env.OPENFORT_SECRET_KEY);

/**
 * Verify an OpenFort access token and return the user identity.
 * Called on every authenticated tRPC request.
 */
export async function verifyOpenfortToken(
  token: string,
): Promise<{ openfortUserId: string; email: string } | null> {
  try {
    const result = await openfortClient.iam.getSession({ accessToken: token });
    return {
      openfortUserId: result.user.id,
      email: result.user.email,
    };
  } catch {
    return null;
  }
}
