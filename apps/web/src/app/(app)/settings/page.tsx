"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { useMe } from "@/features/auth/hooks/useMe";
import { useRequestKycReview } from "@/features/auth/hooks/useRequestKycReview";

const emailSchema = z.object({ email: z.string().email("Enter a valid email") });
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

const inputClass =
  "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20 transition-all";

function Section({ title, description, children, delay = 0 }: { title: string; description?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-slate-900 p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { email } = useAuthStore();
  const { data: me, refetch: refetchMe } = useMe();
  const requestKycReview = useRequestKycReview({
    onSuccess: () => {
      refetchMe();
    },
  });
  const kycStatus = me?.kycStatus ?? "not_started";

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    values: { email: email ?? "" },
  });

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  function onEmailSubmit(data: EmailValues) {
    console.log("update email", data);
  }

  function onPasswordSubmit(data: PasswordValues) {
    console.log("update password", data);
  }

  return (
    <div>
      <motion.h1
        className="mb-8 text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-50"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Settings
      </motion.h1>

      <div className="max-w-2xl space-y-5">
        <Section title="Email address" description="Update the email associated with your account" delay={0.05}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex gap-3">
            <input
              type="email"
              className={`${inputClass} flex-1`}
              {...emailForm.register("email")}
            />
            <motion.button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Update
            </motion.button>
          </form>
          {emailForm.formState.errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
          )}
        </Section>

        <Section title="Password" description="Change your account password" delay={0.1}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">Current password</label>
              <input type="password" placeholder="••••••••" className={inputClass} {...passwordForm.register("currentPassword")} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">New password</label>
              <input type="password" placeholder="At least 8 characters" className={inputClass} {...passwordForm.register("newPassword")} />
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">Confirm new password</label>
              <input type="password" placeholder="••••••••" className={inputClass} {...passwordForm.register("confirmPassword")} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Change password
            </motion.button>
          </form>
        </Section>

        <Section title="KYC verification" description="Required before claiming creator tokens" delay={0.15}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-200">
                {kycStatus.replace("_", " ")}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                {kycStatus === "verified"
                  ? "Your account is ready for token claims."
                  : kycStatus === "pending"
                    ? "Your KYC review is pending."
                    : "Submit your account for KYC review before claiming tokens."}
              </p>
            </div>
            <motion.button
              type="button"
              disabled={kycStatus === "verified" || kycStatus === "pending" || requestKycReview.isPending}
              onClick={() => requestKycReview.mutate()}
              className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-colors hover:bg-zinc-200 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {requestKycReview.isPending ? "Submitting..." : "Start review"}
            </motion.button>
          </div>
        </Section>

        <Section title="Two-factor authentication" description="Add an extra layer of security" delay={0.2}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Authenticator app</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Use an app like Google Authenticator or 1Password</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-zinc-200 relative cursor-not-allowed">
              <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white dark:bg-slate-900 shadow-sm transition-transform" />
            </div>
          </div>
        </Section>

        <Section title="Deposit history" delay={0.25}>
          <div className="py-6 text-center text-zinc-400 dark:text-zinc-500 text-sm">No deposits yet</div>
        </Section>

        <Section title="Trading history" delay={0.3}>
          <div className="py-6 text-center text-zinc-400 dark:text-zinc-500 text-sm">No trades yet</div>
        </Section>
      </div>
    </div>
  );
}
