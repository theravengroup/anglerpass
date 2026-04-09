"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import TurnstileWidget from "@/components/shared/TurnstileWidget";

const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

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
      // Validate Turnstile token server-side before proceeding
      const { verifyTurnstileToken } = await import("@/lib/turnstile");
      const turnstileError = await verifyTurnstileToken(turnstileToken);
      if (turnstileError) {
        setError(turnstileError);
        setIsLoading(false);
        return;
      }

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
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-parchment">
          <svg
            className="size-6 text-forest"
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
          className="mb-2 font-heading text-2xl font-semibold text-forest"
        >
          Check Your Email
        </h1>
        <p className="mb-6 text-sm text-text-secondary">
          If an account exists with that email, we&apos;ve sent a password reset
          link. Please check your inbox and spam folder.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-forest hover:text-forest-deep"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="mb-1 text-center font-heading text-2xl font-semibold text-forest"
      >
        Reset Your Password
      </h1>
      <p className="mb-8 text-center text-sm text-text-secondary">
        Enter your email and we&apos;ll send you a reset link
      </p>

      {error && (
        <div role="alert" aria-live="polite" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
            <p className="text-xs text-red-600" role="alert" aria-live="polite">{errors.email.message}</p>
          )}
        </div>

        <TurnstileWidget onVerify={setTurnstileToken} />

        <Button
          type="submit"
          disabled={isLoading || !turnstileToken}
          className="h-11 w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-forest hover:text-forest-deep"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
