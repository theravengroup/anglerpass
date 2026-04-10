import "server-only";

import { requireAuth, jsonCreated, jsonError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { supportTicketSchema } from "@/lib/validations/support-ticket";

/**
 * POST /api/support
 * Submit a new support ticket for the authenticated user.
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const parsed = supportTicketSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }

  const db = createAdminClient();
  const { data: ticket, error } = await db
    .from("support_tickets")
    .insert({
      user_id: auth.user.id,
      category: parsed.data.category,
      subject: parsed.data.subject,
      message: parsed.data.message,
    })
    .select("id, created_at")
    .single();

  if (error) {
    return jsonError("Failed to submit ticket", 500);
  }

  return jsonCreated({ ticket });
}
