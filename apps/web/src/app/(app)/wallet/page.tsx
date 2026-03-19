"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DepositModal } from "./deposit-modal";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ts));
}

const TX_TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  trade: "Trade",
  dividend: "Dividend",
  ipo_purchase: "IPO Purchase",
};

export default function WalletPage() {
  const [depositOpen, setDepositOpen] = useState(false);

  const { data: balance, isLoading: balanceLoading, refetch } = trpc.wallet.balance.useQuery();
  const { data: transactions, isLoading: txLoading } = trpc.wallet.transactions.useQuery();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Wallet</h1>

      {/* Balance Card */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <p className="text-sm text-zinc-500">Available Balance</p>
          {balanceLoading ? (
            <div className="mt-1 h-10 w-40 animate-pulse rounded-lg bg-zinc-800" />
          ) : (
            <p className="mt-1 text-4xl font-bold">
              {formatUsd(balance?.usdcBalance ?? 0)}
            </p>
          )}

          {balance?.walletAddress && (
            <p className="mt-2 font-mono text-xs text-zinc-600 truncate max-w-xs">
              {balance.walletAddress}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => setDepositOpen(true)}
              disabled={!balance?.walletAddress}
              className="gap-2"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </Button>
            <Button variant="outline" disabled className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw
              <span className="ml-1 text-xs text-zinc-500">Soon</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              title="Refresh balance"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {!balanceLoading && !balance?.walletAddress && (
            <p className="mt-4 text-sm text-zinc-500">
              Your embedded wallet is being set up. Sign out and back in if this persists.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="px-6 py-8 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800" />
              ))}
            </div>
          ) : !transactions?.length ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-500">
              No transactions yet
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.txId}
                    className="border-b border-zinc-800 last:border-0 text-sm"
                  >
                    <td className="px-6 py-4 font-medium">
                      {TX_TYPE_LABEL[tx.type] ?? tx.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={tx.type === "withdrawal" ? "text-red-400" : "text-emerald-400"}>
                        {tx.type === "withdrawal" ? "-" : "+"}{formatUsd(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.status === "confirmed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : tx.status === "failed"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-zinc-700 text-zinc-400"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={() => {
          setDepositOpen(false);
          setTimeout(() => refetch(), 3000); // allow Stripe to process
        }}
      />
    </div>
  );
}
