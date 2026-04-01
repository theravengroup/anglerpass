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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Determine redirect: honor `next` param, or redirect based on role
      const next = searchParams.get("next");
      if (next) {
        router.push(next);
        router.refresh();
        return;
      }

      // Fetch profile to get role for redirect
      const { getRoleHomePath } = await import("@/types/roles");
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .returns<{ role: string }[]>()
        .single();

      const destination = profile?.role
        ? getRoleHomePath(profile.role)
        : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      console.error("[login] Auth error:", err);
      setError(
        "Unable to connect to authentication service. Please try again or contact support."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1
        className="mb-1 text-center text-2xl font-semibold text-[var(--color-forest)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Welcome Back
      </h1>
      <p className="mb-8 text-center text-sm text-[var(--color-text-secondary)]">
        Sign in to your AnglerPass account
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
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[var(--color-river)] hover:text-[var(--color-river-light)]"
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
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-deep)]"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--color-forest)] hover:text-[var(--color-forest-deep)]"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
