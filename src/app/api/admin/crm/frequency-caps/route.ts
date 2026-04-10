import "server-only";

import { requireAdmin, jsonOk, jsonError, jsonCreated } from "@/lib/api/helpers";
import { createFrequencyCapSchema, updateFrequencyCapSchema } from "@/lib/validations/crm";

// ─── GET /api/admin/crm/frequency-caps ────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { data: caps } = await auth.admin.from("crm_frequency_caps")
    .select("*")
    .order("window_hours", { ascending: true });

  return jsonOk({ caps: caps ?? [] });
}

// ─── POST /api/admin/crm/frequency-caps ───────────────────────────

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = createFrequencyCapSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data: cap, error } = await auth.admin.from("crm_frequency_caps")
    .insert(result.data)
    .select()
    .single();

  if (error) {
    return jsonError("Failed to create frequency cap", 500);
  }

  return jsonCreated({ cap });
}

// ─── PATCH /api/admin/crm/frequency-caps ──────────────────────────
// Bulk update (toggle active, edit values)

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = updateFrequencyCapSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { id, ...updates } = result.data;

  const { data: cap, error } = await auth.admin.from("crm_frequency_caps")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error || !cap) {
    return jsonError("Frequency cap not found", 404);
  }

  return jsonOk({ cap });
}
