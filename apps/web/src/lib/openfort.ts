import { Openfort } from "@openfort/openfort-js";
import { env } from "@/lib/env";

// Singleton — initialized once, reused across the app
let _instance: Openfort | null = null;

export function getOpenfort(): Openfort {
  if (!_instance) {
    const publishableKey = env.NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error("OpenFort is not configured. Add NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY to apps/web/.env.local and restart the web server.");
    }

    _instance = new Openfort({
      baseConfiguration: {
        publishableKey,
      },
      // shieldConfiguration enables non-custodial embedded wallets.
      // Add NEXT_PUBLIC_OPENFORT_SHIELD_PUBLISHABLE_KEY when ready for wallet ops (Phase 2).
    });
  }
  return _instance;
}

export function getOpenfortErrorMessage(error: unknown) {
  const details = error as { error?: string; error_description?: string; message?: string };
  const code = details.error;
  const message = details.error_description || details.message;

  if (code === "INVALID_CONFIGURATION" || message === "INVALID_CONFIGURATION") {
    return "OpenFort is not configured for email/password auth. Check the publishable key and enable email/password authentication in the OpenFort dashboard.";
  }

  if (code === "USER_ALREADY_EXISTS") {
    return "An account already exists for this email. Sign in instead.";
  }

  if (code === "INVALID_EMAIL_OR_PASSWORD") {
    return "The email or password is incorrect.";
  }

  if (code === "PROVIDER_DISABLED") {
    return "Email/password sign-in is disabled for this OpenFort project.";
  }

  return message || "Authentication failed";
}
