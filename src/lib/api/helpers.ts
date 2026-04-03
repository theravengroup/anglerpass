import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Standard API Responses ─────────────────────────────────────────

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function jsonCreated<T>(data: T) {
  return Response.json(data, { status: 201 });
}

export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
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

// ─── Ownership Verification ─────────────────────────────────────────

/**
 * Verify that the given user owns the property.
 * Returns the property row on success, or null if not found / not owned.
 */
export async function requirePropertyOwner(
  admin: SupabaseClient,
  propertyId: string,
  userId: string
) {
  const { data: property } = await admin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (!property || property.owner_id !== userId) return null;
  return property;
}

/**
 * Verify that the given user is the club manager (owner).
 * Returns the club row on success, or null if not found / not owned.
 */
export async function requireClubManager(
  admin: SupabaseClient,
  clubId: string,
  userId: string
) {
  const { data: club } = await admin
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .single();

  if (!club || club.owner_id !== userId) return null;
  return club;
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

/**
 * Escape special characters for Supabase/Postgres ilike patterns.
 * Prevents user input from being interpreted as wildcards.
 */
export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
