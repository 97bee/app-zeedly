"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  category: z.string().min(2, "Select a category"),
  tagsRaw: z.string().min(1, "Add at least one tag"),
  youtubeUrl: z.string().url("Enter a valid YouTube URL"),
  subscriberCount: z.coerce.number().int().min(0).default(0),
  avgViews: z.coerce.number().int().min(0).default(0),
  monthlyRevenue: z.coerce.number().min(0).default(0),
  revenueShareBps: z.coerce.number().int().min(50).max(5000).default(500),
});

type FormValues = z.infer<typeof schema>;

const CATEGORIES = ["Entertainment", "Gaming", "Tech", "Productivity", "Finance", "Fitness", "Music", "Education", "Comedy", "Lifestyle", "Other"];

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20 transition-all";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CreatorApplyPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const apply = trpc.creator.submitApplication.useMutation();

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const tags = values.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      await apply.mutateAsync({
        name: values.name, slug: values.slug, category: values.category, tags,
        youtubeUrl: values.youtubeUrl, subscriberCount: values.subscriberCount,
        avgViews: values.avgViews, monthlyRevenue: values.monthlyRevenue,
        valuation: 0, revenueShareBps: values.revenueShareBps,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      if (msg.toLowerCase().includes("taken")) {
        setError("slug", { message: "That username is already taken" });
      } else {
        setError("root", { message: msg });
      }
    }
  }

  if (submitted) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className="mb-4 h-16 w-16 text-emerald-500" />
        <h1 className="text-2xl font-bold font-serif text-zinc-900">Application submitted!</h1>
        <p className="mt-2 text-zinc-500">We&apos;ll review your application and get back to you soon.</p>
        <Button className="mt-6" onClick={() => router.push("/explore")}>Back to Explore</Button>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold font-serif text-zinc-900">Apply as a Creator</h1>
        <p className="mt-2 text-zinc-500">Submit your application to launch an IPO on Zeedly. We&apos;ll review it within 48 hours.</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <motion.div
          className="rounded-2xl border border-zinc-200 bg-white p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <h2 className="mb-5 text-lg font-semibold text-zinc-900">About you</h2>
          <div className="space-y-4">
            <Field label="Display name" error={errors.name?.message}>
              <input {...register("name")} placeholder="MrBeast" className={inputClass} />
            </Field>
            <Field label="Username / slug" hint="Used in your profile URL: zeedly.io/creator/your-slug" error={errors.slug?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">creator/</span>
                <input {...register("slug")} placeholder="mrbeast" className={`${inputClass} pl-20`} />
              </div>
            </Field>
            <Field label="Category" error={errors.category?.message}>
              <select {...register("category")} className={inputClass}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="Comma-separated, e.g. gaming, challenges, philanthropy" error={errors.tagsRaw?.message}>
              <input {...register("tagsRaw")} placeholder="gaming, challenges, philanthropy" className={inputClass} />
            </Field>
            <Field label="YouTube channel URL" error={errors.youtubeUrl?.message}>
              <input {...register("youtubeUrl")} placeholder="https://youtube.com/@mrbeast" className={inputClass} />
            </Field>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-zinc-200 bg-white p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="mb-5 text-lg font-semibold text-zinc-900">Channel metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Subscribers" error={errors.subscriberCount?.message}>
              <input {...register("subscriberCount")} type="number" min="0" placeholder="1000000" className={inputClass} />
            </Field>
            <Field label="Avg. views per video" error={errors.avgViews?.message}>
              <input {...register("avgViews")} type="number" min="0" placeholder="500000" className={inputClass} />
            </Field>
            <Field label="Monthly revenue (USD)" hint="Sponsorships, AdSense, merch, etc." error={errors.monthlyRevenue?.message}>
              <input {...register("monthlyRevenue")} type="number" min="0" placeholder="50000" className={inputClass} />
            </Field>
            <Field label="Revenue share to investors (bps)" hint="500 bps = 5% of your monthly revenue distributed as dividends" error={errors.revenueShareBps?.message}>
              <input {...register("revenueShareBps")} type="number" min="50" max="5000" placeholder="500" className={inputClass} />
            </Field>
          </div>
        </motion.div>

        {errors.root && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{errors.root.message}</div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Button type="submit" disabled={apply.isPending} className="w-full">
            {apply.isPending ? "Submitting..." : "Submit application"}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
