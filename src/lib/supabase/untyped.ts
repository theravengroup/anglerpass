/**
 * Untyped Supabase admin client for tables not yet in the generated types.
 *
 * Use this ONLY for new tables whose migration has been created but types
 * haven't been regenerated yet. Once `supabase gen types` runs, switch
 * back to the typed `createAdminClient()`.
 *
 * The client is created WITHOUT a Database generic, so Supabase won't
 * try to validate table/column names at the type level.
 *
 * ⚠️  This bypasses RLS (service role) — use only in API routes.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let untypedAdmin: SupabaseClient | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createUntypedAdmin(): SupabaseClient<any, "public", any> {
  if (untypedAdmin) return untypedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables for untyped admin client");
  }

  untypedAdmin = createClient(url, key, {
    auth: { persistSession: false },
  });

  return untypedAdmin;
}
