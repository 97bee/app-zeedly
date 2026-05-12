"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { DepositModal } from "./deposit-modal";

function formatUsdt(amount: number) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))} USDT`;
}

function formatFiat(amount: number, currency = "GBP") {
  return new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ts));
}

const TX_TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  trade: "Trade",
  dividend: "Dividend",
  ipo_purchase: "Offering Entry",
};

export default function WalletPage() {
  const [depositOpen, setDepositOpen] = useState(false);

  const { data: balance, isLoading: balanceLoading, refetch } = trpc.wallet.balance.useQuery();
  const { data: transactions, isLoading: txLoading, refetch: refetchTransactions } = trpc.wallet.transactions.useQuery();

  return (
    <div>
      <motion.h1
        className="mb-8 text-3xl font-bold font-serif text-zinc-900"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Wallet
      </motion.h1>

      {/* Balance Card */}
      <motion.div
        className="mb-6 rounded-2xl border border-zinc-200 bg-white p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <p className="text-sm text-zinc-500">Available USDT Balance</p>
        {balanceLoading ? (
          <div className="mt-1 h-10 w-40 animate-pulse rounded-lg bg-zinc-100" />
        ) : (
          <p className="mt-1 text-4xl font-bold text-zinc-900">
            {formatUsdt(balance?.availableUsdtBalance ?? balance?.usdtBalance ?? balance?.usdcBalance ?? 0)}
          </p>
        )}

        {!balanceLoading ? (
          <div className="mt-5 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-400">Available</p>
              <p className="mt-1 font-semibold text-zinc-900">
                {formatUsdt(balance?.availableUsdtBalance ?? balance?.usdtBalance ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-400">Locked in offerings</p>
              <p className="mt-1 font-semibold text-amber-600">
                {formatUsdt(balance?.lockedUsdtBalance ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs text-zinc-400">Internal total</p>
              <p className="mt-1 font-semibold text-zinc-900">
                {formatUsdt(balance?.totalUsdtBalance ?? balance?.usdtBalance ?? 0)}
              </p>
            </div>
          </div>
        ) : null}

        {balance?.walletAddress && (
          <p className="mt-2 font-mono text-xs text-zinc-400 truncate max-w-xs">
            {balance.walletAddress}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button onClick={() => setDepositOpen(true)} className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Deposit
          </Button>
          <Button variant="outline" disabled className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Withdraw
            <span className="ml-1 text-xs text-zinc-400">Soon</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh balance">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {!balanceLoading && !balance?.walletAddress && (
          <p className="mt-4 text-sm text-zinc-400">
            Token claims will use an embedded wallet once minting is available. Deposits are held off-chain as USDT.
          </p>
        )}
      </motion.div>

      {/* Transaction History */}
      <motion.div
        className="rounded-2xl border border-zinc-200 bg-white"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Transaction History</h2>
        </div>
        <div>
          {txLoading ? (
            <div className="px-6 py-8 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
              ))}
            </div>
          ) : !transactions?.length ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-400">No transactions yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400">
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const displayAmount =
                    tx.type === "withdrawal" || tx.type === "ipo_purchase"
                      ? -Math.abs(tx.amount)
                      : tx.amount;

                  return (
                    <tr key={tx.txId} className="border-b border-zinc-50 last:border-0 text-sm">
                      <td className="px-6 py-4 font-medium text-zinc-900">
                        {TX_TYPE_LABEL[tx.type] ?? tx.type}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={displayAmount < 0 ? "text-red-500" : "text-emerald-600"}>
                            {displayAmount < 0 ? "-" : "+"}
                            {formatUsdt(displayAmount)}
                          </span>
                          {tx.type === "deposit" && tx.fiatAmount ? (
                            <p className="text-xs text-zinc-400">
                              {formatFiat(tx.fiatAmount, tx.fiatCurrency ?? "GBP")} converted to USDT
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            tx.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : tx.status === "failed"
                                ? "bg-red-50 text-red-600"
                                : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {tx.createdAt ? formatDate(tx.createdAt) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={() => {
          refetch();
          refetchTransactions();
        }}
      />
    </div>
  );
}
