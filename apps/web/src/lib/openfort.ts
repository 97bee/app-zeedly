import { Openfort } from "@openfort/openfort-js";

// Singleton — initialized once, reused across the app
let _instance: Openfort | null = null;

export function getOpenfort(): Openfort {
  if (!_instance) {
    _instance = new Openfort({
      baseConfiguration: {
        publishableKey: process.env.NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY!,
      },
      // shieldConfiguration enables non-custodial embedded wallets.
      // Add NEXT_PUBLIC_OPENFORT_SHIELD_PUBLISHABLE_KEY when ready for wallet ops (Phase 2).
    });
  }
  return _instance;
}
