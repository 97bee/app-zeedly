"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function formatGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

function formatUsdt(amount: number) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} USDT`;
}

export function DepositModal({ open, onClose, onSuccess }: Props) {
  const [amountStr, setAmountStr] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [credited, setCredited] = useState<{ amount: number; balance: number } | null>(null);
  const amountGbp = Number.parseFloat(amountStr) || 0;
  const deposit = trpc.wallet.deposit.useMutation();
  const quote = trpc.wallet.quoteDeposit.useQuery(
    { amountGbp },
    { enabled: open && amountGbp >= 10 && amountGbp <= 10000 },
  );

  const displayQuote = useMemo(() => {
    if (quote.data) return quote.data;
    return {
      fiatAmount: amountGbp,
      fiatCurrency: "GBP" as const,
      asset: "USDT" as const,
      exchangeRate: 1.25,
      usdtAmount: Math.round(amountGbp * 125) / 100,
    };
  }, [amountGbp, quote.data]);

  async function handleDeposit() {
    if (amountGbp < 10) {
      setError("Minimum deposit is GBP 10");
      return;
    }
    if (amountGbp > 10000) {
      setError("Maximum deposit is GBP 10,000");
      return;
    }

    setError(null);
    try {
      const result = await deposit.mutateAsync({ amountGbp });
      setCredited({ amount: result.usdtAmount, balance: result.balance });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    }
  }

  function handleClose() {
    setAmountStr("100");
    setError(null);
    setCredited(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Deposit funds</h2>
          <button onClick={handleClose} className="text-zinc-400 transition-colors hover:text-zinc-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {credited ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-900">{formatUsdt(credited.amount)} credited</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Available balance: {formatUsdt(credited.balance)}
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-500">Amount to deposit (GBP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">GBP</span>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="1"
                    value={amountStr}
                    onChange={(event) => setAmountStr(event.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-14 pr-4 text-lg text-zinc-900 placeholder-zinc-400 transition-all focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20"
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-400">Min GBP 10 / Max GBP 10,000</p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmountStr(String(preset))}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-white"
                  >
                    GBP {preset}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">You pay</span>
                  <span className="font-medium text-zinc-900">{formatGbp(displayQuote.fiatAmount)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-zinc-500">Converted at</span>
                  <span className="font-medium text-zinc-900">
                    1 GBP = {displayQuote.exchangeRate.toFixed(2)} USDT
                  </span>
                </div>
                <div className="mt-3 border-t border-zinc-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-500">Credited balance</span>
                    <span className="font-semibold text-emerald-600">{formatUsdt(displayQuote.usdtAmount)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                onClick={handleDeposit}
                disabled={deposit.isPending || amountGbp < 10 || amountGbp > 10000}
                className="w-full"
              >
                {deposit.isPending ? "Crediting..." : "Credit USDT balance"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
