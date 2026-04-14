"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  animate,
} from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, Play } from "lucide-react";

/* ── Animated number counter (triggers on scroll into view) ───────── */
function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.6,
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => {
    const [int, dec] = v.toFixed(decimals).split(".");
    const intWithCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${prefix}${intWithCommas}${dec ? "." + dec : ""}${suffix}`;
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, to, duration, mv]);

  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}

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
/* ── Brand logos (inline SVG) ─────────────────────────────────────── */
function BinanceLogo() {
  return (
    <div className="flex items-center gap-3 text-white/50">
      <svg viewBox="0 0 126.61 126.61" className="h-7 w-7 fill-current">
        <path d="m38.73 53.2 24.59-24.58 24.6 24.6 14.29-14.31L63.32 0 24.43 38.9z" />
        <path d="M0 63.31 14.3 49 28.6 63.31 14.3 77.61z" />
        <path d="m38.73 73.43 24.59 24.59 24.6-24.6 14.3 14.29-38.9 38.9-38.9-38.88z" />
        <path d="M98.01 63.31 112.31 49l14.3 14.31-14.3 14.3z" />
        <path d="m77.83 63.3-14.51-14.52-10.73 10.73-1.23 1.23-2.54 2.54 14.5 14.49 14.51-14.46z" />
      </svg>
      <span className="text-2xl font-bold tracking-tight">BINANCE</span>
    </div>
  );
}
function BybitLogo() {
  return (
    <div className="flex items-center gap-2 text-white/50">
      <span className="text-3xl font-black tracking-tighter lowercase italic">
        bybit
      </span>
      <span className="h-2 w-2 rounded-full bg-amber-400/70" />
    </div>
  );
}
function PrivyLogo() {
  return (
    <div className="flex items-center gap-2 text-white/50">
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
      </svg>
      <span className="text-2xl font-semibold tracking-tight">Privy</span>
    </div>
  );
}
const PARTNER_LOGOS = [
  BinanceLogo,
  BybitLogo,
  PrivyLogo,
  BinanceLogo,
  BybitLogo,
  PrivyLogo,
];

const HOW_IT_WORKS = [
  {
    title: "Earn a piece of the\ncreator's future",
    body: "Invest in the long-term success of your favorite creators and build a diversified portfolio of human potential.",
    cta: "Start today!",
    badge: { label: "New deposit", amount: 1200, decimals: 0 },
    accent: "from-zinc-800 to-zinc-950",
  },
  {
    title: "Get monthly dividends",
    body: "Receive regular payouts as your creators grow their audience and increase their global revenue streams.",
    cta: "Invest in creators!",
    badge: { label: "Monthly Return", amount: 482.01, decimals: 2 },
    accent: "from-zinc-700 to-zinc-950",
  },
  {
    title: "Sell anytime on the\nsecondary market",
    body: "Enjoy liquidity and flexibility by trading your creator equity positions on our secure, real-time marketplace.",
    cta: "Choose your favourite!",
    badge: { label: "Congratulations!", amount: 500, decimals: 2 },
    accent: "from-zinc-800 to-black",
  },
];

const FAQS = [
  {
    q: "How do I invest in a creator?",
    a: "Browse the marketplace, pick a creator you believe in, and buy equity in a few taps. No crypto wallet required — we handle the infrastructure so you can focus on the upside.",
  },
  {
    q: "Is there a minimum investment?",
    a: "You can start with as little as $10. Fractional shares let you build a diversified portfolio of creators at any budget.",
  },
  {
    q: "How do you handle regulatory compliance?",
    a: "Zeedly operates under licensed securities frameworks in each market. KYC, AML, and investor accreditation are handled before any equity is issued.",
  },
  {
    q: "What are the tax implications?",
    a: "Dividends and capital gains from creator equity are reported like any other investment. We provide annual tax documents to make filing simple.",
  },
];

/* ── FAQ Accordion ────────────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-7 text-left group"
      >
        <span className="text-lg md:text-xl font-semibold text-zinc-900 group-hover:text-black transition-colors">
          {q}
        </span>
        <motion.div
          className="h-6 w-6 shrink-0 text-zinc-400"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-full w-full fill-none stroke-current stroke-[1.5]"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-7 pr-12 text-base text-zinc-500 leading-relaxed max-w-2xl">
          {a}
        </p>
      </motion.div>
    </div>
  );
}

/* ── Infinite scrolling logos ─────────────────────────────────────── */
function LogoMarquee() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
      <motion.div
        className="flex gap-20 whitespace-nowrap items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((Logo, i) => (
          <div key={i} className="shrink-0">
            <Logo />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Scroll-reveal heading (word-by-word color fill) ──────────────── */
function ScrollRevealWord({
  progress,
  range,
  color,
  children,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
  color: string;
  children: React.ReactNode;
}) {
  const wordColor = useTransform(progress, range, ["#D4D4D8", color]);
  return <motion.span style={{ color: wordColor }}>{children}</motion.span>;
}

function ImagineHeading() {
  const ref = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.2"],
  });

  const lines: { words: string[]; blue?: boolean }[] = [
    { words: ["Imagine", "investing", "in", "Mr"] },
    { words: ["Beast", "or", "KSI", "at", "an", "early"] },
    { words: ["stage."], blue: false },
    { words: ["Now", "you", "can."], blue: true },
  ];
  const flat = lines.flatMap((l) => l.words);
  const total = flat.length;

  let wordIdx = 0;
  return (
    <h2
      ref={ref}
      className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]"
    >
      {lines.map((line, li) => {
        const lastOfLine = li < 2;
        return (
          <span key={li}>
            {line.words.map((w, wi) => {
              const idx = wordIdx++;
              const start = idx / total;
              const end = Math.min(1, (idx + 2) / total);
              return (
                <ScrollRevealWord
                  key={`${li}-${wi}`}
                  progress={scrollYProgress}
                  range={[start, end]}
                  color={line.blue ? "#2B4FFF" : "#18181B"}
                >
                  {w}
                  {wi < line.words.length - 1 ? " " : ""}
                </ScrollRevealWord>
              );
            })}
            {lastOfLine ? <br /> : li === 2 ? " " : null}
          </span>
        );
      })}
    </h2>
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
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div
      id="top"
      className="min-h-screen bg-[#FAFAF8] text-zinc-900 font-[family-name:var(--font-geist-sans)] [&_section[id]]:scroll-mt-24"
    >
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 py-5"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 rounded-full bg-zinc-900/70 backdrop-blur-xl pl-6 pr-2 py-2 ring-1 ring-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-white font-mono pr-2"
          >
            zeedly
          </a>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "How it Works", href: "#how-it-works" },
              { label: "Creators", href: "#creators" },
              { label: "FAQs", href: "#faqs" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
              >
                {item.label}
              </a>
            ))}
          </div>
          <Link
            href="/signup"
            className="ml-2 flex items-center gap-1.5 rounded-full bg-zinc-800 pl-5 pr-4 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-700 ring-1 ring-white/10"
          >
            Sign up
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.nav>

      {/* ─── Hero (full viewport) ───────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative h-screen overflow-hidden bg-black"
      >
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6"
          style={{ opacity: heroOpacity, y: heroTextY }}
        >
          <motion.p
            className="text-xs md:text-sm font-semibold tracking-[0.25em] text-white/90 uppercase mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            The Creator Capital Market
          </motion.p>
          <motion.h1
            className="text-4xl md:text-6xl lg:text-[6rem] font-[family-name:var(--font-serif)] text-white leading-[1.05] italic"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            invest in future stars
          </motion.h1>
          <motion.p
            className="mt-8 text-sm md:text-base text-white/70 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            Short-form video editing for Influencers, Creators and Brands
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <Link
              href="/signup"
              className="group mt-10 inline-flex items-center gap-3 rounded-full bg-white pl-3 pr-8 py-3 text-sm font-semibold text-zinc-900 transition-all hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white">
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </span>
              Sign up today!
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
      <section className="bg-black py-20">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/50 mb-10">
            Trusted by:
          </p>
        </Reveal>
        <LogoMarquee />
      </section>

      {/* ─── How it works (stacked cards) ───────────────────────── */}
      <section id="how-it-works" className="relative bg-[#EFECE3] pt-28 pb-8">
        <Reveal>
          <h2 className="text-center text-5xl md:text-6xl lg:text-7xl font-[family-name:var(--font-serif)] text-zinc-400/60 mb-16">
            How it works
          </h2>
        </Reveal>

        <div className="mx-auto max-w-6xl px-6">
          {HOW_IT_WORKS.map((card, i) => (
            <div
              key={i}
              className="sticky mb-[4vh]"
              style={{ top: `${6 + i * 2}rem` }}
            >
              <motion.div
                className="rounded-[32px] bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)] p-8 md:p-10 ring-1 ring-black/5"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                  {/* Text column */}
                  <div className="order-2 md:order-1">
                    <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 leading-[1.15] whitespace-pre-line">
                      {card.title}
                    </h3>
                    <p className="mt-5 text-base text-zinc-500 leading-relaxed max-w-md">
                      {card.body}
                    </p>
                    <Link
                      href="/signup"
                      className="group mt-8 inline-flex items-center gap-2 rounded-full bg-zinc-900 pl-6 pr-2 py-2.5 text-sm font-semibold text-white transition-all hover:bg-black hover:scale-105 active:scale-95"
                    >
                      {card.cta}
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </div>

                  {/* Image column */}
                  <div className="order-1 md:order-2 relative">
                    <div
                      className={`aspect-[4/3] rounded-3xl bg-gradient-to-br ${card.accent} relative overflow-hidden`}
                    >
                      {/* Moon-like orb */}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-zinc-400/20 to-zinc-900/40 blur-2xl" />
                      </motion.div>
                      <div className="absolute inset-0 flex items-center justify-center text-7xl">
                        <motion.span
                          animate={{ y: [0, -6, 0] }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          🧑‍🚀
                        </motion.span>
                      </div>

                      {/* Floating badge */}
                      <motion.div
                        className="absolute top-5 right-5 rounded-full bg-black/60 backdrop-blur-md px-4 py-2 ring-1 ring-white/20"
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                      >
                        <p className="text-[10px] uppercase tracking-wider text-white/60">
                          {card.badge.label}
                        </p>
                        <p className="text-sm font-bold text-emerald-400">
                          <CountUp
                            to={card.badge.amount}
                            prefix="+$"
                            decimals={card.badge.decimals}
                          />
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Imagine investing (big CTA) ────────────────────────── */}
      <section
        id="creators"
        className="relative bg-[#F7F6F1] py-32 px-8 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_1px_1px,_black_1px,_transparent_0)] [background-size:20px_20px]" />
        <div className="relative max-w-4xl">
          <ImagineHeading />
          <Reveal delay={0.2}>
            <p className="mt-6 text-base text-zinc-500">
              Invest smarter, faster than ever before!
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <Link
              href="/signup"
              className="mt-10 inline-block rounded-full border border-zinc-300 bg-white px-10 py-3 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95 shadow-sm"
            >
              Get Started
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── Features grid (4 cards) ────────────────────────────── */}
      <section
        id="features"
        className="relative bg-[#F7F6F1] pb-32 px-8 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(circle_at_1px_1px,_black_1px,_transparent_0)] [background-size:20px_20px]" />
        <div className="relative mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
          {/* Card 1 — Creator Equity Index */}
          <Reveal>
            <div>
              <div className="h-80 rounded-3xl bg-zinc-200/50 ring-1 ring-zinc-200 flex items-center justify-center p-8">
              <motion.div
                className="relative rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] p-6 w-full max-w-xs"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      M
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">
                      Mr Beast Equity
                    </span>
                  </div>
                  <button className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-light">
                    +
                  </button>
                </div>
                <div className="text-center py-4">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                    Current Balance
                  </p>
                  <p className="text-3xl font-bold text-zinc-900">
                    <CountUp to={12248.64} prefix="$" decimals={2} duration={2} />
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-100">
                  <button className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-1">
                    Send
                  </button>
                  <button className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 py-1 border-l border-zinc-100">
                    Receive
                  </button>
                </div>
              </motion.div>
              </div>
              <h3 className="mt-10 text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
                Creator Equity Index
              </h3>
              <p className="mt-3 text-sm text-zinc-500 max-w-sm leading-relaxed">
                Direct exposure to the growth of the world&apos;s most
                influential digital athletes.
              </p>
            </div>
          </Reveal>

          {/* Card 2 — Real-time Yield Analysis */}
          <Reveal delay={0.1}>
            <div>
              <div className="h-80 rounded-3xl bg-zinc-200/50 ring-1 ring-zinc-200 flex items-center justify-center p-8">
              <motion.div
                className="relative rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] p-6 w-full max-w-sm"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-semibold text-zinc-900">
                    Portfolio Growth
                  </p>
                  <span className="text-sm font-semibold text-emerald-500">
                    <CountUp to={24.8} prefix="+" suffix="%" decimals={1} />
                  </span>
                </div>
                <div className="h-24 flex items-end justify-between gap-1 mb-6">
                  {[40, 55, 35, 70, 95, 60, 50].map((h, i) => (
                    <motion.div
                      key={i}
                      className={`flex-1 rounded-sm ${i === 4 ? "bg-zinc-900" : "bg-zinc-200"}`}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between pt-4 border-t border-zinc-100">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-400">
                      Yield
                    </p>
                    <p className="text-sm font-bold text-zinc-900">
                      <CountUp to={1.2} prefix="$" suffix="k" decimals={1} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-400">
                      Active
                    </p>
                    <p className="text-sm font-bold text-zinc-900">
                      <CountUp to={12} />
                    </p>
                  </div>
                </div>
              </motion.div>
              </div>
              <h3 className="mt-10 text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
                Real-time Yield Analysis
              </h3>
              <p className="mt-3 text-sm text-zinc-500 max-w-sm leading-relaxed">
                Track your dividends and equity performance across your entire
                creator portfolio.
              </p>
            </div>
          </Reveal>

          {/* Card 3 — Earn & get paid today */}
          <Reveal delay={0.15}>
            <div>
              <div className="h-80 rounded-3xl bg-zinc-200/50 ring-1 ring-zinc-200 flex items-center justify-center p-8">
              <motion.div
                className="relative rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] p-6 w-full max-w-xs"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-2 gap-4 pb-5 border-b border-zinc-100">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">
                      Earning
                    </p>
                    <p className="text-lg font-bold text-emerald-500">
                      <CountUp to={5400} prefix="+$" />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">
                      Invested
                    </p>
                    <p className="text-lg font-bold text-zinc-900">
                      <CountUp to={3543} prefix="-$" />
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 text-sm">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-900">
                      KSI Dividend
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Received · 20 Oct
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-500">
                    <CountUp to={120} prefix="+$" decimals={2} />
                  </p>
                </div>
              </motion.div>
              </div>
              <h3 className="mt-10 text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
                Earn &amp; get paid today
              </h3>
              <p className="mt-3 text-sm text-zinc-500 max-w-sm leading-relaxed">
                Your investments deserve rewards. Choose your favourite creator
                and start investing today.
              </p>
            </div>
          </Reveal>

          {/* Card 4 — Accelerate your savings goals */}
          <Reveal delay={0.2}>
            <div>
              <div className="h-80 rounded-3xl bg-zinc-200/50 ring-1 ring-zinc-200 flex items-center justify-center p-8">
              <motion.div
                className="relative rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] p-6 w-full max-w-sm"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-2">
                      New Investment Goal
                    </p>
                    <p className="text-2xl font-bold text-zinc-900">
                      <CountUp to={4550} prefix="$" decimals={2} />
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M12 2 15 8l6 1-4.5 4 1 6L12 16l-5.5 3 1-6L3 9l6-1z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                    initial={{ width: 0 }}
                    whileInView={{ width: "72%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
              </div>
              <h3 className="mt-10 text-2xl md:text-3xl font-semibold text-zinc-900 tracking-tight">
                Accelerate your savings goals
              </h3>
              <p className="mt-3 text-sm text-zinc-500 max-w-sm leading-relaxed">
                Achieve your financial dreams faster by focusing on smart saving
                strategies.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FAQs ───────────────────────────────────────────────── */}
      <section id="faqs" className="bg-white px-8 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-16">
            <div>
              <Reveal>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
                  Frequently asked
                  <br />
                  questions
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 text-base text-zinc-500">
                  Learn more about investing in creators and earning.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.2}>
              <Link
                href="/signup"
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-zinc-900 pl-6 pr-5 py-3 text-sm font-semibold text-white transition-all hover:bg-black hover:scale-105 active:scale-95"
              >
                Start today
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>

          <div className="border-t border-zinc-200">
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <FAQItem q={faq.q} a={faq.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer (on gray/moon bg) ───────────────────────────── */}
      <section className="relative bg-zinc-400 px-8 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(ellipse_at_top,_white,_transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_2px_2px,_white_1px,_transparent_0)] [background-size:24px_24px]" />

        <div className="relative mx-auto max-w-6xl rounded-[36px] bg-zinc-100 p-10 md:p-14 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <Reveal>
                <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 leading-tight max-w-md">
                  Make life simpler by joining us and stay updated on the
                  creator economy.
                </h3>
              </Reveal>
              <Reveal delay={0.15}>
                <form className="mt-8 flex items-center gap-2 rounded-full bg-white/70 backdrop-blur pl-5 pr-2 py-2 ring-1 ring-zinc-200 max-w-sm">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 w-9 shrink-0 rounded-full bg-zinc-900 text-white flex items-center justify-center transition-all hover:bg-black hover:scale-105"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </Reveal>
            </div>

            <Reveal delay={0.2}>
              <div className="grid grid-cols-3 gap-6 md:justify-end md:pt-2">
                {[
                  { title: "Platform", links: ["Invest", "Creators"] },
                  { title: "Company", links: ["About Us", "Careers"] },
                  {
                    title: "Legal",
                    links: ["Privacy Policy", "Terms of Service"],
                  },
                ].map((col) => (
                  <div key={col.title}>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-zinc-400 mb-4">
                      {col.title}
                    </p>
                    <ul className="space-y-3">
                      {col.links.map((link) => (
                        <li key={link}>
                          <a
                            href="#"
                            className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="mt-16 pt-8 border-t border-zinc-200 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900">
                zeedly.ai
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                © 2024 Zeedly.ai — Investing in the Creator Economy.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Share"
                className="h-9 w-9 rounded-full bg-white/70 ring-1 ring-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-white transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current stroke-2"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Email"
                className="h-9 w-9 rounded-full bg-white/70 ring-1 ring-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-white transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current stroke-2"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
