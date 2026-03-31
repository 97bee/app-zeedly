"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  category: z.string().min(2, "Select a category"),
  tagsRaw: z.string().min(1, "Add at least one tag"),
  youtubeUrl: z.string().url("Enter a valid YouTube URL"),
  subscriberCount: z.coerce.number().int().min(0).default(0),
  avgViews: z.coerce.number().int().min(0).default(0),
  monthlyRevenue: z.coerce.number().min(0).default(0),
  revenueShareBps: z.coerce.number().int().min(50).max(5000).default(500),
});

type FormValues = z.infer<typeof schema>;

const CATEGORIES = [
  "Entertainment",
  "Gaming",
  "Tech",
  "Productivity",
  "Finance",
  "Fitness",
  "Music",
  "Education",
  "Comedy",
  "Lifestyle",
  "Other",
];

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none";

export default function CreatorApplyPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const apply = trpc.creator.apply.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const tags = values.tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await apply.mutateAsync({
        name: values.name,
        slug: values.slug,
        category: values.category,
        tags,
        youtubeUrl: values.youtubeUrl,
        subscriberCount: values.subscriberCount,
        avgViews: values.avgViews,
        monthlyRevenue: values.monthlyRevenue,
        valuation: 0,
        revenueShareBps: values.revenueShareBps,
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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-emerald-400" />
        <h1 className="text-2xl font-bold">Application submitted!</h1>
        <p className="mt-2 text-zinc-400">
          We&apos;ll review your application and get back to you soon.
        </p>
        <Button className="mt-6" onClick={() => router.push("/explore")}>
          Back to Explore
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Apply as a Creator</h1>
        <p className="mt-2 text-zinc-400">
          Submit your application to launch an IPO on Zeedly. We&apos;ll review it within 48 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-5 text-lg font-semibold">About you</h2>
          <div className="space-y-4">
            <Field label="Display name" error={errors.name?.message}>
              <input
                {...register("name")}
                placeholder="MrBeast"
                className={inputClass}
              />
            </Field>

            <Field
              label="Username / slug"
              hint="Used in your profile URL: zeedly.io/creator/your-slug"
              error={errors.slug?.message}
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  creator/
                </span>
                <input
                  {...register("slug")}
                  placeholder="mrbeast"
                  className={`${inputClass} pl-20`}
                />
              </div>
            </Field>

            <Field label="Category" error={errors.category?.message}>
              <select {...register("category")} className={inputClass}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Tags"
              hint="Comma-separated, e.g. gaming, challenges, philanthropy"
              error={errors.tagsRaw?.message}
            >
              <input
                {...register("tagsRaw")}
                placeholder="gaming, challenges, philanthropy"
                className={inputClass}
              />
            </Field>

            <Field label="YouTube channel URL" error={errors.youtubeUrl?.message}>
              <input
                {...register("youtubeUrl")}
                placeholder="https://youtube.com/@mrbeast"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-5 text-lg font-semibold">Channel metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Subscribers" error={errors.subscriberCount?.message}>
              <input
                {...register("subscriberCount")}
                type="number"
                min="0"
                placeholder="1000000"
                className={inputClass}
              />
            </Field>

            <Field label="Avg. views per video" error={errors.avgViews?.message}>
              <input
                {...register("avgViews")}
                type="number"
                min="0"
                placeholder="500000"
                className={inputClass}
              />
            </Field>

            <Field
              label="Monthly revenue (USD)"
              hint="Sponsorships, AdSense, merch, etc."
              error={errors.monthlyRevenue?.message}
            >
              <input
                {...register("monthlyRevenue")}
                type="number"
                min="0"
                placeholder="50000"
                className={inputClass}
              />
            </Field>

            <Field
              label="Revenue share to investors (bps)"
              hint="500 bps = 5% of your monthly revenue distributed as dividends"
              error={errors.revenueShareBps?.message}
            >
              <input
                {...register("revenueShareBps")}
                type="number"
                min="50"
                max="5000"
                placeholder="500"
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {errors.root && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {errors.root.message}
          </div>
        )}

        <Button type="submit" disabled={apply.isPending} className="w-full">
          {apply.isPending ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </div>
  );
}
