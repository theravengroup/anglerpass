"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setError(null);
    setIsLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError(
        "Unable to connect to authentication service. Please ensure the application is properly configured."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-parchment)]">
          <svg
            className="size-6 text-[var(--color-forest)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <h1
          className="mb-2 text-2xl font-semibold text-[var(--color-forest)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Check Your Email
        </h1>
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          If an account exists with that email, we&apos;ve sent a password reset
          link. Please check your inbox and spam folder.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-[var(--color-forest)] hover:text-[var(--color-forest-deep)]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="mb-1 text-center text-2xl font-semibold text-[var(--color-forest)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Reset Your Password
      </h1>
      <p className="mb-8 text-center text-sm text-[var(--color-text-secondary)]">
        Enter your email and we&apos;ll send you a reset link
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-deep)]"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--color-forest)] hover:text-[var(--color-forest-deep)]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
