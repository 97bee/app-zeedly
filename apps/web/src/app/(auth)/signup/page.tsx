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
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-950 placeholder-slate-400 transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/5";

function AuthImagePanel() {
  return (
    <div className="relative hidden min-h-[620px] overflow-hidden bg-[#111318] lg:block">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0)_42%),radial-gradient(circle_at_25%_25%,rgba(148,163,184,0.32),transparent_34%),radial-gradient(circle_at_80%_65%,rgba(212,236,44,0.16),transparent_30%),linear-gradient(145deg,#111318,#050608)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_256_256%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noise%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.9%22_numOctaves=%224%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23noise)%22_opacity=%220.06%22/%3E%3C/svg%3E')] opacity-50" />
      <div className="absolute left-10 right-10 top-12 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-2 w-24 rounded-full bg-white/25" />
            <div className="mt-3 h-2 w-14 rounded-full bg-white/10" />
          </div>
          <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
            +18.4%
          </div>
        </div>
        <div className="grid grid-cols-6 items-end gap-2">
          {[42, 58, 50, 88, 72, 108].map((height, index) => (
            <span
              key={index}
              className="rounded-t-lg bg-gradient-to-t from-white/20 to-white/50"
              style={{ height }}
            />
          ))}
        </div>
      </div>
      <div className="absolute bottom-10 right-10 z-10 max-w-[320px] text-right">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Creator Capital
        </div>
        <h2 className="text-4xl font-black leading-[1.03] tracking-[-0.05em] text-white">
          Back tomorrow’s breakout creators.
        </h2>
        <p className="mt-4 text-sm leading-6 text-white/40">
          Deposit through Stripe, lock USDT into offerings, and claim compliant token allocations.
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
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
      await openfort.auth.signUpWithEmailPassword({ email: data.email, password: data.password });
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
        <div>
          <Link href="/" className="inline-block text-xl font-black tracking-[-0.05em] text-slate-950">
            zeedly
          </Link>
          <h1 className="mt-8 text-3xl font-black tracking-[-0.04em] text-slate-950">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">Start investing in your favourite creators</p>
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={inputClass}
              {...register("password")}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={inputClass}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 py-4 text-sm font-bold text-white shadow-[0_8px_28px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
            {!isSubmitting && <ArrowUpRight className="h-4 w-4" />}
          </motion.button>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-800 transition-colors hover:text-slate-950">
              Sign in
            </Link>
          </p>
        </form>
        </div>
        <AuthImagePanel />
      </div>
    </motion.div>
  );
}
