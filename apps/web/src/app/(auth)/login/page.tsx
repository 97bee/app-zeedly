"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getOpenfort, getOpenfortErrorMessage } from "@/lib/openfort";
import { useAuthStore } from "@/store/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-950 placeholder-slate-400 transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/5";

function AuthImagePanel() {
  return (
    <div className="relative hidden min-h-[620px] overflow-hidden bg-[#111318] lg:block">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0)_42%),radial-gradient(circle_at_25%_25%,rgba(148,163,184,0.32),transparent_34%),radial-gradient(circle_at_80%_65%,rgba(212,236,44,0.16),transparent_30%),linear-gradient(145deg,#111318,#050608)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_256_256%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noise%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.9%22_numOctaves=%224%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23noise)%22_opacity=%220.06%22/%3E%3C/svg%3E')] opacity-50" />
      <div className="absolute inset-x-10 top-12 grid grid-cols-3 gap-3 opacity-80">
        {[38, 64, 82, 56, 72, 44].map((height, index) => (
          <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <div className="mb-6 h-2 w-14 rounded-full bg-white/20" />
            <div className="flex items-end gap-1.5">
              {[0.45, 0.7, 0.55, 0.9].map((scale, barIndex) => (
                <span
                  key={barIndex}
                  className="w-full rounded-t bg-white/25"
                  style={{ height: `${height * scale}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-10 right-10 z-10 max-w-[320px] text-right">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Creator Capital
        </div>
        <h2 className="text-4xl font-black leading-[1.03] tracking-[-0.05em] text-white">
          Invest in the creators you believe in.
        </h2>
        <p className="mt-4 text-sm leading-6 text-white/40">
          Own creator upside, lock allocations, and claim tokens after compliant checks.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setServerError(null);
    try {
      const openfort = getOpenfort();
      await openfort.auth.logInWithEmailPassword({ email: data.email, password: data.password });
      const token = await openfort.getAccessToken();
      if (!token) throw new Error("No token returned");
      setAuth(token, "", data.email);
      router.push("/explore");
    } catch (err) {
      setServerError(getOpenfortErrorMessage(err));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid min-h-[620px] overflow-hidden rounded-[32px] bg-white shadow-[0_40px_120px_rgba(0,0,0,0.42)] lg:grid-cols-2 lg:rounded-[40px]">
        <div className="flex flex-col justify-center gap-8 p-8 sm:p-12">
          <Link href="/" className="text-xl font-black tracking-[-0.05em] text-slate-950">
            zeedly
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">Login to access your account</p>
          </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {serverError}
            </motion.div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputClass}
              {...register("password")}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 py-4 text-sm font-bold text-white shadow-[0_8px_28px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
            {!isSubmitting && <ArrowUpRight className="h-4 w-4" />}
          </motion.button>

          <p className="text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-slate-800 transition-colors hover:text-slate-950">
              Sign up
            </Link>
          </p>
        </form>
        </div>
        <AuthImagePanel />
      </div>
    </motion.div>
  );
}
