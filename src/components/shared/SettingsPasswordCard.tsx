"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function SettingsPasswordCard() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordFormData) {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Unable to update password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-stone-light/20">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-forest/10">
            <Lock className="size-4 text-forest" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Change Password
            </h3>
            <p className="text-xs text-text-secondary">
              Update your account password
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            Password updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-new-password" className="text-sm">
              New password
            </Label>
            <Input
              id="settings-new-password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...register("newPassword")}
              aria-invalid={!!errors.newPassword}
            />
            {errors.newPassword && (
              <p className="text-xs text-red-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-confirm-password" className="text-sm">
              Confirm new password
            </Label>
            <Input
              id="settings-confirm-password"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              size="sm"
              className="bg-forest text-white hover:bg-forest-deep"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
