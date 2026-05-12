import type { Transaction } from "../db/index.js";
import { IPOPurchaseEntity, TransactionEntity } from "../db/index.js";

const FIAT_TO_USDT_RATE = {
  GBP: 1.25,
  USD: 1,
  EUR: 1.08,
} as const;

export type SupportedFiatCurrency = keyof typeof FIAT_TO_USDT_RATE;

const LOCKED_PURCHASE_STATUSES = new Set(["locked", "claimable"]);

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function signedLedgerAmount(tx: Transaction): number {
  if (tx.status !== "confirmed") return 0;

  if (tx.type === "withdrawal") return -Math.abs(tx.amount);
  if (tx.type === "ipo_purchase") return tx.amount > 0 ? -tx.amount : tx.amount;

  return tx.amount;
}

export function normalizeFiatCurrency(currency: string): SupportedFiatCurrency {
  const normalized = currency.trim().toUpperCase();
  if (normalized in FIAT_TO_USDT_RATE) return normalized as SupportedFiatCurrency;
  return "GBP";
}

export function quoteFiatToUsdt(amount: number, currency: string) {
  const fiatCurrency = normalizeFiatCurrency(currency);
  const exchangeRate = FIAT_TO_USDT_RATE[fiatCurrency];
  const usdtAmount = roundMoney(amount * exchangeRate);

  return {
    fiatAmount: roundMoney(amount),
    fiatCurrency,
    asset: "USDT" as const,
    exchangeRate,
    usdtAmount,
  };
}

export function quoteGbpToUsdt(amountGbp: number) {
  return quoteFiatToUsdt(amountGbp, "GBP");
}

export async function getOffchainWalletSummary(userId: string) {
  const [transactionsResult, purchasesResult] = await Promise.all([
    TransactionEntity.query.byUser({ userId }).go(),
    IPOPurchaseEntity.query.byUser({ userId }).go(),
  ]);

  const totalUsdtBalance = roundMoney(
    transactionsResult.data.reduce((sum, tx) => sum + signedLedgerAmount(tx), 0),
  );

  const lockedUsdtBalance = roundMoney(
    purchasesResult.data
      .filter((purchase) => LOCKED_PURCHASE_STATUSES.has(purchase.status ?? ""))
      .reduce((sum, purchase) => sum + purchase.usdAmount, 0),
  );

  const availableUsdtBalance = roundMoney(Math.max(0, totalUsdtBalance - lockedUsdtBalance));

  return {
    availableUsdtBalance,
    lockedUsdtBalance,
    totalUsdtBalance,
  };
}

export async function getOffchainUsdtBalance(userId: string): Promise<number> {
  return (await getOffchainWalletSummary(userId)).availableUsdtBalance;
}
