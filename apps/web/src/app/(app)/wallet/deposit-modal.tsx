"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

const CREDIT_POLL_INTERVAL_MS = 2000;
const CREDIT_TIMEOUT_MS = 60_000;
const CREDIT_TOLERANCE_USDT = 0.01;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const stripePublishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const hasStripePublishableKey =
  /^pk_(test|live)_/.test(stripePublishableKey) &&
  !/REPLACE_ME|placeholder|your_|xxx|example/i.test(stripePublishableKey);
const stripePromise = hasStripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

const CURRENCIES = ["GBP", "USD", "EUR"] as const;
const FALLBACK_RATES: Record<(typeof CURRENCIES)[number], number> = {
  GBP: 1.25,
  USD: 1,
  EUR: 1.08,
};

type Currency = (typeof CURRENCIES)[number];

function formatFiat(amount: number, currency: Currency) {
  return new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatUsdt(amount: number) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} USDT`;
}

function StripeDepositForm({
  onProcessing,
  onError,
}: {
  onProcessing: (status: string) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || !isElementReady) return;

    setIsSubmitting(true);
    const submitResult = await elements.submit();
    if (submitResult.error) {
      setIsSubmitting(false);
      onError(
        submitResult.error.message ??
          "Stripe payment form could not be submitted",
      );
      return;
    }

    let result;
    try {
      result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/wallet`,
        },
        redirect: "if_required",
      });
    } catch (err) {
      setIsSubmitting(false);
      onError(err instanceof Error ? err.message : "Stripe payment failed");
      return;
    }
    setIsSubmitting(false);

    if (result.error) {
      onError(result.error.message ?? "Stripe payment failed");
      return;
    }

    onProcessing(result.paymentIntent?.status ?? "processing");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        onReady={() => setIsElementReady(true)}
        onLoadError={(event) =>
          onError(event.error.message ?? "Stripe payment form failed to load")
        }
      />
      <Button
        type="submit"
        disabled={!stripe || !elements || !isElementReady || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Confirming..." : "Pay with Stripe"}
      </Button>
    </form>
  );
}

type CreditingState = {
  expectedUsdt: number;
  baseline: number;
  startedAt: number;
};

type FinalState = {
  amount: number;
  status: "credited" | "processing";
};

export function DepositModal({ open, onClose, onSuccess }: Props) {
  const [amountStr, setAmountStr] = useState("100");
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [crediting, setCrediting] = useState<CreditingState | null>(null);
  const [processing, setProcessing] = useState<FinalState | null>(null);
  const baselineRef = useRef<number | null>(null);
  const amount = Number.parseFloat(amountStr) || 0;
  const createIntent = trpc.wallet.createDepositIntent.useMutation();
  const quote = trpc.wallet.quoteDeposit.useQuery(
    { amount, currency },
    { enabled: open && amount >= 10 && amount <= 10000 },
  );

  // Pre-load balance so we have a baseline to compare against once the
  // Stripe webhook credits the user's wallet. While crediting, poll on
  // an interval so the cached balance (shared with the wallet page) stays
  // fresh.
  const balanceQuery = trpc.wallet.balance.useQuery(undefined, {
    enabled: open,
    refetchInterval: crediting ? CREDIT_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: true,
  });

  // Capture baseline on first successful balance read after the modal opens.
  useEffect(() => {
    if (!open) {
      baselineRef.current = null;
      return;
    }
    if (baselineRef.current === null && balanceQuery.data) {
      baselineRef.current = balanceQuery.data.availableUsdtBalance ?? 0;
    }
  }, [open, balanceQuery.data]);

  // Detect that the deposit has landed.
  useEffect(() => {
    if (!crediting) return;
    const latest = balanceQuery.data?.availableUsdtBalance ?? null;
    if (latest === null) return;
    if (latest + CREDIT_TOLERANCE_USDT >= crediting.baseline + crediting.expectedUsdt) {
      setProcessing({ amount: crediting.expectedUsdt, status: "credited" });
      setCrediting(null);
      onSuccess();
    }
  }, [balanceQuery.data, crediting, onSuccess]);

  // Time out gracefully if the webhook is slow — show a "still processing"
  // message rather than spinning forever.
  useEffect(() => {
    if (!crediting) return;
    const remaining = Math.max(
      0,
      CREDIT_TIMEOUT_MS - (Date.now() - crediting.startedAt),
    );
    const timer = setTimeout(() => {
      setProcessing({ amount: crediting.expectedUsdt, status: "processing" });
      setCrediting(null);
      onSuccess();
    }, remaining);
    return () => clearTimeout(timer);
  }, [crediting, onSuccess]);

  const displayQuote = useMemo(() => {
    if (quote.data) return quote.data;
    const exchangeRate = FALLBACK_RATES[currency];
    return {
      fiatAmount: amount,
      fiatCurrency: currency,
      asset: "USDT" as const,
      exchangeRate,
      usdtAmount: Math.round(amount * exchangeRate * 100) / 100,
    };
  }, [amount, currency, quote.data]);

  async function handleCreateIntent() {
    if (!stripePromise) {
      setError(
        "Stripe publishable key is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your pk_test key.",
      );
      return;
    }
    if (amount < 10) {
      setError(`Minimum deposit is ${currency} 10`);
      return;
    }
    if (amount > 10000) {
      setError(`Maximum deposit is ${currency} 10,000`);
      return;
    }

    setError(null);
    try {
      const result = await createIntent.mutateAsync({ amount, currency });
      if (!result.clientSecret)
        throw new Error("Stripe did not return a client secret");
      setClientSecret(result.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    }
  }

  function handleClose() {
    setAmountStr("100");
    setCurrency("GBP");
    setError(null);
    setClientSecret(null);
    setProcessing(null);
    setCrediting(null);
    baselineRef.current = null;
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Deposit funds</h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 transition-colors hover:text-zinc-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {crediting ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-600">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-900">
                  Crediting your wallet…
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Payment confirmed. Waiting for {formatUsdt(crediting.expectedUsdt)} to
                  arrive in your balance.
                </p>
              </div>
              <Button variant="ghost" onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          ) : processing ? (
            <div className="space-y-5 text-center">
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                  processing.status === "credited"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-900">
                  {processing.status === "credited"
                    ? "Deposit credited"
                    : "Deposit processing"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {processing.status === "credited"
                    ? `${formatUsdt(processing.amount)} is now available in your wallet.`
                    : `${formatUsdt(processing.amount)} is on its way — this can take a minute. Refresh shortly to see it land.`}
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          ) : clientSecret && stripePromise ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">You pay</span>
                  <span className="font-medium text-zinc-900">
                    {formatFiat(
                      displayQuote.fiatAmount,
                      displayQuote.fiatCurrency,
                    )}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-zinc-500">Estimated credit</span>
                  <span className="font-semibold text-emerald-600">
                    {formatUsdt(displayQuote.usdtAmount)}
                  </span>
                </div>
              </div>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeDepositForm
                  onError={setError}
                  onProcessing={() => {
                    const baseline =
                      balanceQuery.data?.availableUsdtBalance ??
                      baselineRef.current ??
                      0;
                    setCrediting({
                      expectedUsdt: displayQuote.usdtAmount,
                      baseline,
                      startedAt: Date.now(),
                    });
                  }}
                />
              </Elements>
              <Button
                variant="ghost"
                onClick={() => setClientSecret(null)}
                className="w-full"
              >
                Change amount
              </Button>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-500">
                  Amount to deposit
                </label>
                <div className="grid grid-cols-[92px_1fr] gap-2">
                  <select
                    value={currency}
                    onChange={(event) =>
                      setCurrency(event.target.value as Currency)
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm font-medium text-zinc-900 transition-all focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20"
                  >
                    {CURRENCIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="1"
                    value={amountStr}
                    onChange={(event) => setAmountStr(event.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-lg text-zinc-900 placeholder-zinc-400 transition-all focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20"
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Min {currency} 10 / Max {currency} 10,000
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmountStr(String(preset))}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-white"
                  >
                    {currency} {preset}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">You pay</span>
                  <span className="font-medium text-zinc-900">
                    {formatFiat(
                      displayQuote.fiatAmount,
                      displayQuote.fiatCurrency,
                    )}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-zinc-500">Converted at</span>
                  <span className="font-medium text-zinc-900">
                    1 {displayQuote.fiatCurrency} ={" "}
                    {displayQuote.exchangeRate.toFixed(2)} USDT
                  </span>
                </div>
                <div className="mt-3 border-t border-zinc-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-500">
                      Credited balance
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {formatUsdt(displayQuote.usdtAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                onClick={handleCreateIntent}
                disabled={
                  createIntent.isPending || amount < 10 || amount > 10000
                }
                className="w-full"
              >
                {createIntent.isPending
                  ? "Preparing Stripe..."
                  : "Continue to Stripe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
