"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Play, TrendingUp, Users, DollarSign } from "lucide-react";

/* ── Trusted-by logos (text placeholders) ─────────────────────────── */
const PARTNERS = ["INTERNET", "bitpanda", "ROCKET INTERNET", "bitpanda"];

/* ── Creator grid for "Start investing today" ─────────────────────── */
const CREATORS = [
  { name: "@playventure", subs: "9.3M Subs", img: "/creators/1.jpg" },
  { name: "@playventure", subs: "5.2M Subs", img: "/creators/2.jpg" },
  { name: "@playventure", subs: "9.3M Subs", img: "/creators/3.jpg" },
  { name: "@playventure", subs: "9.3M Subs", img: "/creators/4.jpg" },
  { name: "@playventure", subs: "9.3M Subs", img: "/creators/5.jpg" },
  { name: "@playventure", subs: "9.3M Subs", img: "/creators/6.jpg" },
  { name: "@playventure", subs: "9.3M Subs", img: "/creators/7.jpg" },
];

/* ── FAQ data ─────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "What is Zeedly?",
    a: "Your favourite creator monetises through advertising and you receive a share of that revenue. Easy, right?",
    open: true,
  },
  { q: "How can I earn money?", a: "Invest in creator IPOs, hold tokens for monthly dividends, or trade on the secondary market for capital gains." },
  { q: "How many people recommend Zeedly?", a: "Thousands of early investors trust Zeedly to connect them with the creator economy." },
  { q: "Can I create an account?", a: "Yes — sign up with just an email. No crypto wallet needed, we handle everything behind the scenes." },
  { q: "Is there any creator live?", a: "We are onboarding creators now. Join the waitlist to be the first to invest when they go live." },
];

/* ── FAQ Accordion Item ───────────────────────────────────────────── */
function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-zinc-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-semibold text-zinc-900">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="pb-5 text-sm text-zinc-600">{a}</p>}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-zinc-900 font-[family-name:var(--font-geist-sans)]">

      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <span className="text-xl font-bold tracking-tight text-white font-mono">zeedly</span>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/80">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#creators" className="hover:text-white transition-colors">Creators</a>
        </div>
        <Link
          href="/explore"
          className="flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-lime-dark"
        >
          Open App
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/></svg>
        </Link>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="relative h-[560px] overflow-hidden">
        {/* Background image placeholder — dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-800" />
        {/* If you have a hero image, use: */}
        {/* <img src="/hero-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" /> */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-[family-name:var(--font-serif)] text-white leading-[1.1]">
            Invest in<br />
            <em className="text-lime not-italic">future</em> stars
          </h1>
          <Link
            href="/signup"
            className="mt-8 rounded-full bg-lime px-8 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-900 transition-colors hover:bg-lime-dark"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* ─── Trusted by ─────────────────────────────────────────── */}
      <section className="border-b border-zinc-200 py-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-6">
          Trusted by
        </p>
        <div className="flex items-center justify-center gap-12 opacity-40 overflow-hidden">
          {PARTNERS.map((name, i) => (
            <span key={i} className="text-lg font-semibold tracking-widest text-zinc-700 whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Creators create. Brands pay. You profit. ───────────── */}
      <section className="mx-auto max-w-6xl px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-serif)] leading-[1.15]">
              Creators create.<br />
              Brands pay.<br />
              <em className="not-italic text-zinc-500">You profit</em>
            </h2>
            <div className="mt-8 flex gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-lime px-6 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-900 hover:bg-lime-dark transition-colors"
              >
                Get Started
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Learn More
              </a>
            </div>
            <div className="mt-12">
              <p className="text-sm font-bold text-zinc-900">Investments made easy</p>
              <p className="mt-2 text-sm text-zinc-600 max-w-sm">
                Your favourite creator monetises through advertising and you receive
                a share of that revenue. <strong>Easy, right?</strong>
              </p>
            </div>
          </div>

          <div className="relative">
            {/* Stats overlay image area */}
            <div className="rounded-2xl bg-zinc-800 aspect-[4/3] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
              {/* <img src="/creator-studio.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" /> */}
            </div>
            <div className="absolute bottom-8 -left-4 rounded-xl bg-white shadow-xl px-5 py-3">
              <p className="text-2xl font-bold text-zinc-900">$24.29B</p>
              <p className="text-xs text-zinc-500">Total revenue</p>
            </div>
            <div className="absolute -bottom-4 right-4 rounded-xl bg-white shadow-xl px-5 py-3">
              <p className="text-2xl font-bold text-zinc-900">1,200,200</p>
              <p className="text-xs text-zinc-500">Total views</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Own a piece of an Emergent creator ─────────────────── */}
      <section id="how-it-works" className="py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-serif)] leading-[1.15]">
          Own a piece of an<br />
          <em className="not-italic text-zinc-500">Emergent</em> creator
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-700">
          <span className="flex items-center gap-2"><span className="text-lg">&#9989;</span> Invest in a creator&apos;s career</span>
          <span className="flex items-center gap-2"><span className="text-lg">&#128588;</span> Creator receives monthly income</span>
          <span className="flex items-center gap-2"><span className="text-lg">&#127881;</span> You get monthly earnings</span>
        </div>

        {/* App mockup card */}
        <div className="mx-auto mt-12 max-w-xs rounded-2xl bg-white shadow-2xl p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-900">Good morning Ali</p>
            <span className="text-zinc-400">&#128276;</span>
          </div>
          <div className="rounded-xl bg-lime p-4 mb-5">
            <p className="text-xs font-semibold text-zinc-700">Portfolio value</p>
            <p className="text-2xl font-bold text-zinc-900">$90,322.96</p>
            <p className="text-xs text-emerald-700">+10.32 (3.4%)</p>
            <p className="mt-1 text-xs font-medium text-zinc-700">Show Analytics &rsaquo;</p>
          </div>
          <p className="text-xs font-semibold text-zinc-700 mb-2">Trending</p>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-14 rounded-lg bg-zinc-200" />
            ))}
          </div>
          <p className="text-xs font-semibold text-zinc-700 mb-2">Watchlist</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-zinc-300" />
                <span className="text-xs font-medium text-zinc-700">VIRJZ</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-900">$4,817.34</p>
                <p className="text-[10px] text-emerald-600">+3.13%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-zinc-300" />
                <span className="text-xs font-medium text-zinc-700">ANDREA</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-900">$2,616.10</p>
                <p className="text-[10px] text-red-500">-0.03%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Support your Creator ───────────────────────────────── */}
      <section className="py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-serif)] flex items-center justify-center gap-4 flex-wrap">
          Support your
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-200 overflow-hidden">
            <Play className="h-6 w-6 text-zinc-600" />
          </span>
          <strong>Creator</strong>
        </h2>

        {/* Video card mockup */}
        <div className="mx-auto mt-16 max-w-xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg">
            <div className="relative rounded-xl bg-zinc-800 aspect-video overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
              {/* Overlay badges */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs">
                <div className="h-5 w-5 rounded-full bg-zinc-300" />
                <div>
                  <p className="font-semibold text-zinc-900">Jessica Edwards</p>
                  <p className="text-[10px] text-emerald-600">New supporter &middot; +$1,000</p>
                </div>
              </div>
              <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs">
                <span className="font-semibold text-zinc-900">&#9989; $10,000.82</span>
                <p className="text-[10px] text-zinc-500">Creator&apos;s earnings</p>
              </div>
              <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-xs">
                <span className="font-semibold text-zinc-900">&#128101; 119,018</span>
                <p className="text-[10px] text-zinc-500">Total supporters</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 px-2">
              <Play className="h-3 w-3 text-zinc-400" />
              <div className="h-1 flex-1 rounded-full bg-zinc-200">
                <div className="h-1 w-2/3 rounded-full bg-lime" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Grow your money ────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-serif)] leading-[1.15]">
            Grow<br />
            <em className="not-italic text-zinc-500">your money</em>
          </h2>
          <p className="mt-4 text-sm font-bold text-zinc-900">Invest with intention.</p>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            Monitor your portfolio in real time and dive deeper into every position with your AI advisor.
          </p>
        </div>

        <div className="mx-auto max-w-5xl px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monitor card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <h3 className="text-center text-xl font-[family-name:var(--font-serif)]">
              Monitor<br /><em className="not-italic text-zinc-500">investment</em> performance
            </h3>
            <p className="mt-3 text-center text-xs text-zinc-500">
              Track the latest activity across your entire portfolio and compare performance to major indices.
            </p>
            <div className="mt-6 rounded-xl bg-zinc-900 p-5">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Portfolio</p>
              <p className="text-xs text-zinc-400">Total balance</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-white">$325,321</p>
                <span className="text-[10px] text-emerald-400">+$12,124 (3.8%)</span>
              </div>
              {/* Chart placeholder */}
              <div className="mt-4 h-24 rounded-lg bg-zinc-800 flex items-end p-2">
                <svg viewBox="0 0 200 60" className="w-full h-full text-emerald-500">
                  <path d="M0,40 Q30,45 50,30 T100,35 T150,20 T200,25" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div className="mt-3 flex gap-2">
                {["1W", "1M", "3M", "6M", "1Y", "2Y"].map((t) => (
                  <span
                    key={t}
                    className={`rounded-full px-3 py-1 text-[10px] ${t === "1M" ? "bg-zinc-700 text-white" : "text-zinc-500"}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Markets card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-8">
            <h3 className="text-center text-xl font-[family-name:var(--font-serif)]">
              Track<br /><em className="not-italic text-zinc-500">what&apos;s</em> next
            </h3>
            <p className="mt-3 text-center text-xs text-zinc-500">
              Explore the market, add assets to your watchlist, and stay ahead with news and AI insights.
            </p>
            <div className="mt-6 rounded-xl bg-zinc-900 p-5">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Markets at a glance</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Dow Jones", ticker: "DJI", price: "$42.34k", change: "1.78%", up: true },
                  { name: "NASDAQ", ticker: "DJI", price: "$19.20k", change: "2.47%", up: true },
                  { name: "S&P 500", ticker: "SPX", price: "$5.93k", change: "2.47%", up: true },
                  { name: "VIX", ticker: "VIX", price: "$18.96", change: "7.83%", up: false },
                ].map((m) => (
                  <div key={m.name} className="rounded-lg bg-zinc-800 p-3">
                    <div className="h-8 mb-2 rounded bg-zinc-700/50 flex items-end p-1">
                      <svg viewBox="0 0 60 20" className={`w-full h-full ${m.up ? "text-emerald-500" : "text-red-500"}`}>
                        <path
                          d={m.up ? "M0,15 Q15,5 30,10 T60,5" : "M0,5 Q15,15 30,10 T60,15"}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-white">{m.name}</p>
                    <p className="text-[10px] text-zinc-500">{m.ticker}</p>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-white">{m.price}</span>
                      <span className={`text-[10px] ${m.up ? "text-emerald-400" : "text-red-400"}`}>{m.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Start investing today ──────────────────────────────── */}
      <section id="creators" className="py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-serif)] leading-[1.15]">
          Start<br />
          <em className="not-italic text-zinc-500">investing today</em>
        </h2>

        {/* Creator grid */}
        <div className="mx-auto mt-12 max-w-3xl px-8">
          <div className="flex flex-wrap items-end justify-center gap-4">
            {CREATORS.map((c, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl bg-zinc-200 ${
                  i < 3 ? "w-40 h-48" : "w-36 h-44"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-xs font-semibold text-white">{c.name}</p>
                  <p className="text-[10px] text-white/70">{c.subs}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/signup"
          className="mt-10 inline-block rounded-full bg-lime px-8 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-900 hover:bg-lime-dark transition-colors"
        >
          Get Started
        </Link>
      </section>

      {/* ─── FAQs ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="w-64 h-[500px] rounded-[40px] bg-zinc-900 border-4 border-zinc-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl" />
              <div className="absolute inset-4 top-8 rounded-3xl bg-white" />
            </div>
          </div>

          {/* FAQ list */}
          <div>
            <h2 className="text-4xl font-[family-name:var(--font-serif)] mb-8">FAQs</h2>
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} defaultOpen={faq.open} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA / Footer ───────────────────────────────────────── */}
      <section className="bg-zinc-900 text-white px-8 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-serif)] leading-[1.15]">
            We are connecting the<br />
            <em className="not-italic text-lime">creators&apos; earnings</em><br />
            with their audiences
          </h2>

          <div className="mt-12">
            <p className="text-sm text-zinc-400 mb-4 font-[family-name:var(--font-serif)]">Be the first to know</p>
            <div className="flex max-w-md gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 border-b border-zinc-700 bg-transparent py-2 text-sm text-white placeholder-zinc-600 focus:border-lime focus:outline-none"
              />
              <button className="rounded-full bg-lime px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-zinc-900 hover:bg-lime-dark transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <footer className="bg-zinc-900 border-t border-zinc-800 px-8 py-6">
        <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
          {["About", "Solutions", "How it Works", "FAQ", "Terms", "Policy", "Risk", "Disclosure"].map((link) => (
            <a key={link} href="#" className="hover:text-zinc-300 transition-colors">{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
