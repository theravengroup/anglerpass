import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Standard API Responses ─────────────────────────────────────────

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

// ─── Authentication Helpers ─────────────────────────────────────────

interface AuthResult {
  user: { id: string; email?: string };
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Verifies the request is from an authenticated user.
 * Returns the user and supabase client, or null if unauthorized.
 */
export async function requireAuth(): Promise<AuthResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { user, supabase };
}

/**
 * Verifies the request is from an authenticated admin.
 * Returns the user, supabase client, and admin client, or null.
 */
export async function requireAdmin() {
  const auth = await requireAuth();
  if (!auth) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (profile?.role !== "admin") return null;

  return { ...auth, admin };
}

// ─── Input Sanitization ─────────────────────────────────────────────

/**
 * Parse a positive integer from a string, with a default and max.
 */
export function parsePositiveInt(
  value: string | null,
  defaultValue: number,
  max = 3650
): number {
  const parsed = parseInt(value ?? String(defaultValue), 10);
  if (isNaN(parsed) || parsed < 1) return defaultValue;
  return Math.min(parsed, max);
}
