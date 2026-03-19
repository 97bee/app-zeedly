import { env } from "../lib/config.js";

// USDC mint addresses
const USDC_MINT: Record<string, string> = {
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

function getUsdcMint(): string {
  const rpc = env.SOLANA_RPC_URL;
  if (rpc.includes("devnet")) return USDC_MINT.devnet;
  return USDC_MINT.mainnet;
}

/**
 * Read the USDC balance for a Solana wallet address.
 * Returns balance in USD (USDC = 1:1 USD, 6 decimals).
 */
export async function getUsdcBalance(walletAddress: string): Promise<number> {
  const res = await fetch(env.SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        walletAddress,
        { mint: getUsdcMint() },
        { encoding: "jsonParsed" },
      ],
    }),
  });

  const data = await res.json();
  const accounts: Array<{ account: { data: { parsed: { info: { tokenAmount: { uiAmount: number } } } } } }> =
    data.result?.value ?? [];

  if (accounts.length === 0) return 0;
  return accounts[0].account.data.parsed.info.tokenAmount.uiAmount ?? 0;
}

/**
 * Get the Solana wallet address for an OpenFort user.
 * Pulls from the player's linked accounts (the embedded wallet).
 */
export async function getSolanaWallet(openfortUserId: string): Promise<string | null> {
  const { openfortClient } = await import("../openfort/index.js");
  try {
    const player = await openfortClient.iam.v1.players.get(openfortUserId);
    // Find the embedded wallet account (Solana addresses are 32–44 chars base58)
    const solanaAccount = player.linkedAccounts.find(
      (a) => a.address && a.address.length >= 32 && a.address.length <= 44,
    );
    return solanaAccount?.address ?? null;
  } catch {
    return null;
  }
}
