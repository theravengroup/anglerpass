"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import TurnstileWidget from "@/components/shared/TurnstileWidget";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
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

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      // Determine redirect: honor `next` param, or redirect based on role
      const next = searchParams.get("next");
      if (next) {
        router.push(next);
        router.refresh();
        return;
      }

      // Redirect to the user's primary (signup) role dashboard
      const { getRoleHomePath } = await import("@/types/roles");
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, roles")
        .returns<{ role: string; roles: string[] | null }[]>()
        .maybeSingle();

      const primaryRole = profile?.roles?.[0] ?? profile?.role ?? "angler";

      // Reset active role to primary so dashboard/sidebar match
      if (profile && profile.role !== primaryRole) {
        await supabase
          .from("profiles")
          .update({ role: primaryRole })
          .eq("id", (await supabase.auth.getUser()).data.user!.id);
      }

      const destination = getRoleHomePath(primaryRole);
      router.push(destination);
      router.refresh();
      // Keep spinner running until navigation completes
    } catch (err) {
      console.error("[login] Auth error:", err);
      setError(
        "Unable to connect to authentication service. Please try again or contact support."
      );
      setIsLoading(false);
    }
  }

  // Display messages from query params (e.g. after password reset or expired link)
  const queryError = searchParams.get("error");
  const queryMessage = searchParams.get("message");

  const QUERY_ERROR_MESSAGES: Record<string, string> = {
    auth_callback_failed:
      "Your confirmation link has expired or is invalid. Please try again.",
  };

  const QUERY_SUCCESS_MESSAGES: Record<string, string> = {
    password_updated:
      "Your password has been updated. Sign in with your new password.",
  };

  return (
    <div>
      <h1 className="mb-1 text-center font-heading text-2xl font-semibold text-forest">
        Welcome Back
      </h1>
      <p className="mb-8 text-center text-sm text-text-secondary">
        Sign in to your AnglerPass account
      </p>

      {queryMessage && QUERY_SUCCESS_MESSAGES[queryMessage] && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {QUERY_SUCCESS_MESSAGES[queryMessage]}
        </div>
      )}

      {queryError && QUERY_ERROR_MESSAGES[queryError] && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
        >
          {QUERY_ERROR_MESSAGES[queryError]}
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
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
            <p className="text-xs text-red-600" role="alert" aria-live="polite">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-river hover:text-river-light"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-red-600" role="alert" aria-live="polite">
              {errors.password.message}
            </p>
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
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Early Access account creation is coming soon.{" "}
        <Link
          href="/#waitlist"
          className="font-medium text-forest hover:text-forest-deep"
        >
          Join the waitlist
        </Link>{" "}
        to be first in line.
      </p>
    </div>
  );
}
