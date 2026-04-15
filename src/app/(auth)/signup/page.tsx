"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TurnstileWidget from "@/components/shared/TurnstileWidget";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["landowner", "club_admin", "angler", "guide", "corporate"], {
    error: "Please select your role",
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

const ROLE_LABELS: Record<string, string> = {
  landowner: "Landowner",
  club_admin: "Club / Outfitter",
  angler: "Angler",
  guide: "Independent Fishing Guide",
  corporate: "Corporate Sponsor",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationRole = searchParams.get("role");
  const invitationToken = searchParams.get("invitation");

  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: invitationRole as SignupFormData["role"] | undefined,
    },
  });

  // Pre-fill role from invitation URL
  useEffect(() => {
    if (invitationRole && ["landowner", "club_admin", "angler", "guide", "corporate"].includes(invitationRole)) {
      setValue("role", invitationRole as SignupFormData["role"]);
    }
  }, [invitationRole, setValue]);

  async function onSubmit(data: SignupFormData) {
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

      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName ?? "",
            display_name: data.firstName,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        // Provide a user-friendly message for duplicate email signups
        const msg = authError.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("user already")) {
          setError(
            "An account with this email already exists. Try signing in instead."
          );
          setDuplicateEmail(true);
        } else {
          setError(authError.message);
        }
        return;
      }

      // If email confirmation is required, the user won't have a session yet
      // Check by trying to get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Email confirmation required - show message instead of redirecting
        setError(null);
        setIsLoading(false);
        setConfirmationSent(true);
        return;
      }

      // Redirect: if club_admin with invitation, go to setup; otherwise role home
      const { getRoleHomePath } = await import("@/types/roles");
      if (data.role === "club_admin" && invitationToken) {
        router.push(`/club/setup?invitation=${invitationToken}`);
      } else {
        router.push(getRoleHomePath(data.role));
      }
      router.refresh();
    } catch {
      setError(
        "Unable to connect to authentication service. Please ensure the application is properly configured."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <div>
        <h1
          className="mb-1 text-center font-heading text-2xl font-semibold text-forest"
        >
          Check Your Email
        </h1>
        <p className="mb-6 text-center text-sm text-text-secondary">
          We sent a confirmation link to your email address. Please click the
          link to verify your account and get started.
        </p>
        <p className="text-center text-sm text-text-secondary">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={() => setConfirmationSent(false)}
            className="font-medium text-forest hover:text-forest-deep"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="mb-1 text-center font-heading text-2xl font-semibold text-forest"
      >
        Create Your Account
      </h1>
      <p className="mb-8 text-center text-sm text-text-secondary">
        Join AnglerPass and access private water
      </p>

      {error && (
        <div role="alert" aria-live="polite" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {duplicateEmail && (
            <>
              {" "}
              <Link href="/login" className="font-medium text-red-800 underline">
                Sign in here
              </Link>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              placeholder="First name"
              autoComplete="given-name"
              {...register("firstName")}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <p className="text-xs text-red-600" role="alert" aria-live="polite">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              placeholder="Last name"
              autoComplete="family-name"
              {...register("lastName")}
            />
          </div>
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-red-600" role="alert" aria-live="polite">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>I am a...</Label>
          <Select onValueChange={(value) => setValue("role", value as SignupFormData["role"])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-red-600" role="alert" aria-live="polite">{errors.role.message}</p>
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
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
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
