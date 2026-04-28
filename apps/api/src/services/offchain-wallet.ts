import type { Transaction } from "../db/index.js";
import { TransactionEntity } from "../db/index.js";

const GBP_TO_USDT_RATE = 1.25;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function signedLedgerAmount(tx: Transaction): number {
  if (tx.status !== "confirmed") return 0;

  if (tx.type === "withdrawal") return -Math.abs(tx.amount);
  if (tx.type === "ipo_purchase") return tx.amount > 0 ? -tx.amount : tx.amount;

  return tx.amount;
}

export function quoteGbpToUsdt(amountGbp: number) {
  const usdtAmount = roundMoney(amountGbp * GBP_TO_USDT_RATE);

  return {
    fiatAmount: roundMoney(amountGbp),
    fiatCurrency: "GBP" as const,
    asset: "USDT" as const,
    exchangeRate: GBP_TO_USDT_RATE,
    usdtAmount,
  };
}

export async function getOffchainUsdtBalance(userId: string): Promise<number> {
  const result = await TransactionEntity.query.byUser({ userId }).go();
  const balance = result.data.reduce((sum, tx) => sum + signedLedgerAmount(tx), 0);
  return roundMoney(balance);
}
