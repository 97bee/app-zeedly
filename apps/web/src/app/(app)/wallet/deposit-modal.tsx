"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Inner form — rendered once we have a clientSecret
function CheckoutForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? "Processing…" : "Pay"}
        </Button>
      </div>
    </form>
  );
}

export function DepositModal({ open, onClose, onSuccess }: Props) {
  const [amountStr, setAmountStr] = useState("50");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const depositIntent = trpc.wallet.depositIntent.useMutation();

  async function handleContinue() {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount < 10) {
      setError("Minimum deposit is $10");
      return;
    }
    setError(null);
    try {
      const { clientSecret: secret } = await depositIntent.mutateAsync({ amountUsd: amount });
      setClientSecret(secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payment");
    }
  }

  function handleClose() {
    setClientSecret(null);
    setAmountStr("50");
    setError(null);
    onClose();
  }

  function handleSuccess() {
    setClientSecret(null);
    setAmountStr("50");
    setError(null);
    onSuccess();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold">Deposit funds</h2>
          <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!clientSecret ? (
            // Step 1 — amount selection
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="1"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-7 pr-4 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-600">Min $10 · Max $10,000</p>
              </div>

              {/* Quick-select presets */}
              <div className="flex gap-2">
                {[25, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmountStr(String(preset))}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 py-1.5 text-sm text-zinc-300 hover:border-emerald-500 hover:text-white transition-colors"
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                onClick={handleContinue}
                disabled={depositIntent.isPending}
                className="w-full"
              >
                {depositIntent.isPending ? "Loading…" : "Continue to payment"}
              </Button>
            </div>
          ) : (
            // Step 2 — card payment
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: { colorPrimary: "#10b981", colorBackground: "#09090b" },
                },
              }}
            >
              <CheckoutForm onSuccess={handleSuccess} onClose={handleClose} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
