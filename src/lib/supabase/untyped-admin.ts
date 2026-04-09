import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Untyped service-role client for tables not yet in generated Supabase types.
 *
 * Tables using this client:
 * - compass_conversations (migration 00055)
 * - support_tickets (migration 00056)
 *
 * Once `supabase gen types` is re-run after migrations are applied, this file
 * can be removed and all routes can switch to the standard `createAdminClient()`.
 */
export function createUntypedAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
