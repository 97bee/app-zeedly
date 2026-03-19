"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/auth";

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

export default function SettingsPage() {
  const { email } = useAuthStore();

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    values: { email: email ?? "" },
  });

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  function onEmailSubmit(data: EmailValues) {
    // TODO: wire up to tRPC mutation
    console.log("update email", data);
  }

  function onPasswordSubmit(data: PasswordValues) {
    // TODO: wire up to tRPC mutation
    console.log("update password", data);
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Email */}
        <Card>
          <CardHeader>
            <CardTitle>Email address</CardTitle>
            <CardDescription>Update the email associated with your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex gap-3">
              <Input
                type="email"
                className="flex-1"
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register("email")}
              />
              <Button type="submit" variant="secondary" disabled={emailForm.formState.isSubmitting}>
                Update
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  error={passwordForm.formState.errors.currentPassword?.message}
                  {...passwordForm.register("currentPassword")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register("newPassword")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register("confirmPassword")}
                />
              </div>
              <Button type="submit" variant="secondary" disabled={passwordForm.formState.isSubmitting}>
                Change password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 2FA */}
        <Card>
          <CardHeader>
            <CardTitle>Two-factor authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">Authenticator app</p>
                <p className="text-xs text-zinc-500 mt-0.5">Use an app like Google Authenticator or 1Password</p>
              </div>
              <Switch disabled aria-label="Enable 2FA" />
            </div>
          </CardContent>
        </Card>

        {/* Deposit History */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-zinc-500 text-sm">No deposits yet</div>
          </CardContent>
        </Card>

        {/* Trading History */}
        <Card>
          <CardHeader>
            <CardTitle>Trading history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-zinc-500 text-sm">No trades yet</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
