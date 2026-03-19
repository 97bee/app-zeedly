import Link from "next/link";
import { TrendingUp, Rocket, PieChart, DollarSign } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-emerald-500" />
          <span className="text-xl font-bold">Zeedly</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-8 py-24 text-center">
        <div className="mb-6 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
          The Creator Stock Market
        </div>
        <h1 className="text-5xl font-bold leading-tight md:text-6xl">
          Invest in the creators
          <br />
          <span className="text-emerald-400">you believe in</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Buy creator tokens, earn monthly dividends from their revenue, and
          trade anytime. Like an IPO for YouTubers — powered by blockchain,
          but feels like any other app.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/explore"
            className="rounded-lg bg-emerald-600 px-8 py-3.5 font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Explore Creators
          </Link>
          <Link
            href="/ipo"
            className="rounded-lg border border-zinc-700 px-8 py-3.5 font-medium text-white transition-colors hover:bg-zinc-800"
          >
            View IPOs
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-8 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
            <Rocket className="mb-4 h-10 w-10 text-emerald-500" />
            <h3 className="mb-2 text-xl font-semibold">Creator IPOs</h3>
            <p className="text-sm text-zinc-400">
              Get in early at a fixed price when creators launch on the
              platform. Like buying shares at IPO.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
            <DollarSign className="mb-4 h-10 w-10 text-emerald-500" />
            <h3 className="mb-2 text-xl font-semibold">Monthly Dividends</h3>
            <p className="text-sm text-zinc-400">
              When creators earn, you earn. Receive your share of their
              revenue every month, directly to your account.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
            <PieChart className="mb-4 h-10 w-10 text-emerald-500" />
            <h3 className="mb-2 text-xl font-semibold">Trade Anytime</h3>
            <p className="text-sm text-zinc-400">
              Buy and sell creator tokens instantly. No lock-ups, no waiting
              periods — full liquidity from day one.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-3xl px-8 py-16 text-center">
        <h2 className="mb-12 text-3xl font-bold">How it works</h2>
        <div className="space-y-8 text-left">
          {[
            {
              step: "1",
              title: "Sign up with email",
              desc: "No crypto wallet needed. Sign up like any other app — we handle the rest behind the scenes.",
            },
            {
              step: "2",
              title: "Deposit funds",
              desc: "Add money via card, Apple Pay, or bank transfer. Your balance shows in USD.",
            },
            {
              step: "3",
              title: "Invest in creators",
              desc: "Browse IPOs or buy on the secondary market. Each creator has their own token you can own.",
            },
            {
              step: "4",
              title: "Earn & trade",
              desc: "Hold for monthly dividends or sell anytime. When the creator grows, your investment grows.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold">
                {item.step}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-zinc-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-8 py-8 text-center text-sm text-zinc-600">
        Zeedly &copy; {new Date().getFullYear()} — The Creator Stock Market
      </footer>
    </div>
  );
}
