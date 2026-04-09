/**
 * Type-safe CRM database query helpers.
 *
 * The CRM tables (campaigns, campaign_sends, etc.) are not yet in the
 * generated Supabase types. This module provides typed query wrappers
 * using the admin client with explicit return types.
 *
 * Once `supabase gen types` is re-run, these can be replaced with
 * direct typed queries.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = ReturnType<SupabaseClient["from"]> & { [k: string]: any };

/**
 * Access a CRM table that isn't in the generated Supabase types.
 * Returns an untyped query builder — callers should use `.returns<T>()`
 * for type-safe reads and `as Record<string, unknown>` for inserts.
 */
export function crmTable(admin: SupabaseClient, table: string): UntypedFrom {
  // The Supabase client accepts any table name at runtime even if
  // TypeScript doesn't know about it. We cast to bypass the type check.
  return admin.from(table) as UntypedFrom;
}
