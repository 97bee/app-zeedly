"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import { ChevronDown, Play } from "lucide-react";

/* ── Reusable scroll-reveal wrapper ───────────────────────────────── */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────── */
const PARTNERS = ["INTERNET", "bitpanda", "ROCKET INTERNET", "bitpanda", "INTERNET", "bitpanda", "ROCKET INTERNET"];

const CREATORS = [
  { name: "@playventure", subs: "9.3M Subs" },
  { name: "@playventure", subs: "5.2M Subs" },
  { name: "@playventure", subs: "9.3M Subs" },
  { name: "@playventure", subs: "9.3M Subs" },
  { name: "@playventure", subs: "9.3M Subs" },
  { name: "@playventure", subs: "9.3M Subs" },
  { name: "@playventure", subs: "9.3M Subs" },
];

const FAQS = [
  { q: "What is Zeedly?", a: "Your favourite creator monetises through advertising and you receive a share of that revenue. Easy, right?", open: true },
  { q: "How can I earn money?", a: "Invest in creator IPOs, hold tokens for monthly dividends, or trade on the secondary market for capital gains." },
  { q: "How many people recommend Zeedly?", a: "Thousands of early investors trust Zeedly to connect them with the creator economy." },
  { q: "Can I create an account?", a: "Yes — sign up with just an email. No crypto wallet needed, we handle everything behind the scenes." },
  { q: "Is there any creator live?", a: "We are onboarding creators now. Join the waitlist to be the first to invest when they go live." },
];

/* ── FAQ Accordion ────────────────────────────────────────────────── */
function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-zinc-200">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="text-sm font-semibold text-zinc-900">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm text-zinc-600">{a}</p>
      </motion.div>
    </div>
  );
}

/* ── Infinite scrolling logos ─────────────────────────────────────── */
function LogoMarquee() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#FAFAF8] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#FAFAF8] to-transparent z-10" />
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...PARTNERS, ...PARTNERS].map((name, i) => (
          <span key={i} className="text-lg font-semibold tracking-widest text-zinc-400">
            {name}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Floating stat badge ──────────────────────────────────────────── */
function FloatingBadge({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      animate={{ y: [0, -6, 0] }}
      // @ts-expect-error framer-motion transition override for floating
      transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay } }}
    >
      {children}
    </motion.div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div id="top" className="min-h-screen bg-[#FAFAF8] text-zinc-900 font-[family-name:var(--font-geist-sans)] [&_section[id]]:scroll-mt-24">

      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <a
          href="#top"
          className="rounded-full bg-zinc-900/60 backdrop-blur-md px-5 py-2.5 text-lg font-bold tracking-tight text-white font-mono ring-1 ring-white/10"
        >
          zeedly
        </a>
        <div className="hidden md:flex items-center gap-1 rounded-full bg-zinc-900/60 backdrop-blur-md px-2 py-2 ring-1 ring-white/10">
          {[
            { label: "How it works", href: "#how-it-works" },
            { label: "Features", href: "#features" },
            { label: "Creators", href: "#creators" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all"
            >
              {item.label}
            </a>
          ))}
        </div>
        <Link
          href="/explore"
          className="flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-all hover:bg-lime-dark hover:scale-105 ring-1 ring-zinc-900/10"
        >
          Open App
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/></svg>
        </Link>
      </motion.nav>

      {/* ─── Hero (full viewport) ───────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900" />
          {/* Replace with: <img src="/hero-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" /> */}
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>

        <motion.div
          className="relative z-10 flex flex-col items-center justify-center h-full text-center"
          style={{ opacity: heroOpacity, y: heroTextY }}
        >
          <motion.h1
            className="text-6xl md:text-8xl lg:text-9xl font-[family-name:var(--font-serif)] text-white leading-[1.05]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Invest in<br />
            <motion.em
              className="text-lime not-italic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              future
            </motion.em>{" "}
            stars
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Link
              href="/signup"
              className="mt-10 inline-block rounded-full bg-lime px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-zinc-900 transition-all hover:bg-lime-dark hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6 text-white/40" />
        </motion.div>
      </section>

      {/* ─── Trusted by (marquee) ───────────────────────────────── */}
      <section className="border-b border-zinc-200 py-10">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-6">
            Trusted by
          </p>
        </Reveal>
        <LogoMarquee />
      </section>

      {/* ─── Creators create. Brands pay. You profit. ───────────── */}
      <section className="mx-auto max-w-6xl px-8 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <Reveal>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] leading-[1.1]">
                Creators create.<br />
                Brands pay.<br />
                <em className="not-italic text-zinc-400">You profit</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex gap-4">
                <Link
                  href="/signup"
                  className="rounded-full bg-lime px-7 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-900 hover:bg-lime-dark transition-all hover:scale-105 active:scale-95"
                >
                  Get Started
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-full border border-zinc-300 px-7 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  Learn More
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-14">
                <p className="text-sm font-bold text-zinc-900">Investments made easy</p>
                <p className="mt-2 text-sm text-zinc-500 max-w-sm leading-relaxed">
                  Your favourite creator monetises through advertising and you receive
                  a share of that revenue. <strong className="text-zinc-800">Easy, right?</strong>
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <div className="relative">
              <motion.div
                className="rounded-2xl bg-zinc-800 aspect-[4/3] relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
              </motion.div>
              <motion.div
                className="absolute bottom-8 -left-4 rounded-xl bg-white shadow-xl px-5 py-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                animate={{ y: [0, -5, 0] }}
              >
                <p className="text-2xl font-bold text-zinc-900">$24.29B</p>
                <p className="text-xs text-zinc-500">Total revenue</p>
              </motion.div>
              <motion.div
                className="absolute -bottom-4 right-4 rounded-xl bg-white shadow-xl px-5 py-3"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                animate={{ y: [0, -4, 0] }}
              >
                <p className="text-2xl font-bold text-zinc-900">1,200,200</p>
                <p className="text-xs text-zinc-500">Total views</p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Own a piece of an Emergent creator ─────────────────── */}
      <section id="how-it-works" className="py-28 text-center overflow-hidden">
        <Reveal>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] leading-[1.1]">
            Own a piece of an<br />
            <em className="not-italic text-zinc-400">Emergent</em> creator
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-600">
            <span className="flex items-center gap-2"><span className="text-lg">&#9989;</span> Invest in a creator&apos;s career</span>
            <span className="flex items-center gap-2"><span className="text-lg">&#128588;</span> Creator receives monthly income</span>
            <span className="flex items-center gap-2"><span className="text-lg">&#127881;</span> You get monthly earnings</span>
          </div>
        </Reveal>

        {/* App mockup card */}
        <Reveal delay={0.2}>
          <motion.div
            className="mx-auto mt-14 max-w-xs rounded-2xl bg-white shadow-2xl p-6 text-left"
            whileHover={{ y: -8, boxShadow: "0 25px 60px -12px rgba(0,0,0,0.15)" }}
            transition={{ duration: 0.4 }}
          >
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
                <div key={i} className="h-16 w-14 rounded-lg bg-zinc-100" />
              ))}
            </div>
            <p className="text-xs font-semibold text-zinc-700 mb-2">Watchlist</p>
            <div className="space-y-3">
              {[
                { name: "VIRJZ", price: "$4,817.34", change: "+3.13%", up: true },
                { name: "ANDREA", price: "$2,616.10", change: "-0.03%", up: false },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-200" />
                    <span className="text-xs font-medium text-zinc-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-900">{item.price}</p>
                    <p className={`text-[10px] ${item.up ? "text-emerald-600" : "text-red-500"}`}>{item.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </Reveal>
      </section>

      {/* ─── Support your Creator ───────────────────────────────── */}
      <section className="py-28 text-center overflow-hidden">
        <Reveal>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] flex items-center justify-center gap-4 flex-wrap">
            Support your
            <motion.span
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-200 overflow-hidden"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Play className="h-6 w-6 text-zinc-600" />
            </motion.span>
            <strong>Creator</strong>
          </h2>
        </Reveal>

        {/* Video card mockup */}
        <Reveal delay={0.2}>
          <motion.div
            className="mx-auto mt-16 max-w-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg">
              <div className="relative rounded-xl bg-zinc-800 aspect-video overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
                <motion.div
                  className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="h-5 w-5 rounded-full bg-zinc-300" />
                  <div>
                    <p className="font-semibold text-zinc-900">Jessica Edwards</p>
                    <p className="text-[10px] text-emerald-600">New supporter &middot; +$1,000</p>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs"
                  initial={{ opacity: 0, y: -10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="font-semibold text-zinc-900">&#9989; $10,000.82</span>
                  <p className="text-[10px] text-zinc-500">Creator&apos;s earnings</p>
                </motion.div>
                <motion.div
                  className="absolute bottom-4 right-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                >
                  <span className="font-semibold text-zinc-900">&#128101; 119,018</span>
                  <p className="text-[10px] text-zinc-500">Total supporters</p>
                </motion.div>
              </div>
              <div className="mt-2 flex items-center gap-2 px-2">
                <Play className="h-3 w-3 text-zinc-400" />
                <div className="h-1 flex-1 rounded-full bg-zinc-200 overflow-hidden">
                  <motion.div
                    className="h-1 rounded-full bg-lime"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "66%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </section>

      {/* ─── Grow your money ────────────────────────────────────── */}
      <section id="features" className="py-28">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] leading-[1.1]">
              Grow<br />
              <em className="not-italic text-zinc-400">your money</em>
            </h2>
            <p className="mt-5 text-sm font-bold text-zinc-900">Invest with intention.</p>
            <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
              Monitor your portfolio in real time and dive deeper into every position with your AI advisor.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto max-w-5xl px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Reveal delay={0.1}>
            <motion.div
              className="rounded-2xl border border-zinc-200 bg-white p-8 h-full"
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-center text-xl font-[family-name:var(--font-serif)]">
                Monitor<br /><em className="not-italic text-zinc-400">investment</em> performance
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
                <div className="mt-4 h-24 rounded-lg overflow-hidden">
                  <svg viewBox="0 0 200 60" className="w-full h-full">
                    <motion.path
                      d="M0,40 Q30,45 50,30 T100,35 T150,20 T200,25"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  </svg>
                </div>
                <div className="mt-3 flex gap-2">
                  {["1W", "1M", "3M", "6M", "1Y", "2Y"].map((t) => (
                    <span key={t} className={`rounded-full px-3 py-1 text-[10px] transition-colors ${t === "1M" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </Reveal>

          <Reveal delay={0.25}>
            <motion.div
              className="rounded-2xl border border-zinc-200 bg-white p-8 h-full"
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-center text-xl font-[family-name:var(--font-serif)]">
                Track<br /><em className="not-italic text-zinc-400">what&apos;s</em> next
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
                    <motion.div
                      key={m.name}
                      className="rounded-lg bg-zinc-800 p-3"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="h-8 mb-2 rounded bg-zinc-700/50 flex items-end p-1 overflow-hidden">
                        <svg viewBox="0 0 60 20" className={`w-full h-full ${m.up ? "text-emerald-500" : "text-red-500"}`}>
                          <motion.path
                            d={m.up ? "M0,15 Q15,5 30,10 T60,5" : "M0,5 Q15,15 30,10 T60,15"}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: 0.3 }}
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-white">{m.name}</p>
                      <p className="text-[10px] text-zinc-500">{m.ticker}</p>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-xs font-bold text-white">{m.price}</span>
                        <span className={`text-[10px] ${m.up ? "text-emerald-400" : "text-red-400"}`}>{m.change}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ─── Start investing today ──────────────────────────────── */}
      <section id="creators" className="py-28 text-center overflow-hidden">
        <Reveal>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] leading-[1.1]">
            Start<br />
            <em className="not-italic text-zinc-400">investing today</em>
          </h2>
        </Reveal>

        <div className="mx-auto mt-14 max-w-3xl px-8">
          <div className="flex flex-wrap items-end justify-center gap-4">
            {CREATORS.map((c, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <motion.div
                  className={`relative overflow-hidden rounded-2xl bg-zinc-200 cursor-pointer ${
                    i < 3 ? "w-40 h-48" : "w-36 h-44"
                  }`}
                  whileHover={{ scale: 1.05, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-xs font-semibold text-white">{c.name}</p>
                    <p className="text-[10px] text-white/70">{c.subs}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.4}>
          <Link
            href="/signup"
            className="mt-12 inline-block rounded-full bg-lime px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-zinc-900 transition-all hover:bg-lime-dark hover:scale-105 active:scale-95"
          >
            Get Started
          </Link>
        </Reveal>
      </section>

      {/* ─── FAQs ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-8 py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <Reveal>
            <div className="flex justify-center">
              <motion.div
                className="w-64 h-[500px] rounded-[40px] bg-zinc-900 border-4 border-zinc-700 shadow-2xl relative overflow-hidden"
                whileHover={{ rotateY: 5, rotateX: -2 }}
                transition={{ duration: 0.5 }}
                style={{ transformPerspective: 800 }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl z-10" />
                <div className="absolute inset-3 top-8 rounded-3xl bg-white" />
              </motion.div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div>
              <h2 className="text-4xl font-[family-name:var(--font-serif)] mb-8">FAQs</h2>
              {FAQS.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} defaultOpen={faq.open} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA / Footer ───────────────────────────────────────── */}
      <section className="bg-zinc-900 text-white px-8 py-28 relative overflow-hidden">
        {/* Decorative lines */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="0.5" />
          </svg>
        </motion.div>

        <div className="mx-auto max-w-4xl relative z-10">
          <Reveal>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] leading-[1.1]">
              We are connecting the<br />
              <em className="not-italic text-lime">creators&apos; earnings</em><br />
              with their audiences
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-14">
              <p className="text-sm text-zinc-400 mb-4 font-[family-name:var(--font-serif)]">Be the first to know</p>
              <div className="flex max-w-md gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 border-b border-zinc-700 bg-transparent py-2.5 text-sm text-white placeholder-zinc-600 focus:border-lime focus:outline-none transition-colors"
                />
                <motion.button
                  className="rounded-full bg-lime px-7 py-2.5 text-sm font-semibold uppercase tracking-wider text-zinc-900 hover:bg-lime-dark transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

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
