import "server-only";

import { requireAdmin, jsonOk, jsonError, jsonCreated } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";
import { z } from "zod";

// ─── GET /api/admin/crm/frequency-caps ────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { data: caps } = await crmTable(auth.admin, "crm_frequency_caps")
    .select("*")
    .order("window_hours", { ascending: true });

  return jsonOk({ caps: caps ?? [] });
}

// ─── POST /api/admin/crm/frequency-caps ───────────────────────────

const createCapSchema = z.object({
  name: z.string().min(1).max(100),
  max_sends: z.number().int().min(1).max(100),
  window_hours: z.number().int().min(1).max(8760), // max 1 year
  applies_to: z.enum(["marketing", "all"]).default("marketing"),
  is_active: z.boolean().default(true),
});

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = createCapSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data: cap, error } = await crmTable(auth.admin, "crm_frequency_caps")
    .insert(result.data as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    return jsonError("Failed to create frequency cap", 500);
  }

  return jsonCreated({ cap });
}

// ─── PATCH /api/admin/crm/frequency-caps ──────────────────────────
// Bulk update (toggle active, edit values)

const updateCapSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  max_sends: z.number().int().min(1).max(100).optional(),
  window_hours: z.number().int().min(1).max(8760).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const result = updateCapSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { id, ...updates } = result.data;

  const { data: cap, error } = await crmTable(auth.admin, "crm_frequency_caps")
    .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();

  if (error || !cap) {
    return jsonError("Frequency cap not found", 404);
  }

  return jsonOk({ cap });
}
