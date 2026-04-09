import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { crmTable } from "@/lib/crm/admin-queries";
import { getContactTimeline } from "@/lib/crm/conversions";

/**
 * GET /api/admin/crm/contacts/[id]
 *
 * Get a contact's full profile, engagement stats, tags, and activity timeline.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const admin = createAdminClient();

  try {
    // Get profile
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, display_name, role, created_at, phone_number, sms_opt_in")
      .eq("id", id)
      .maybeSingle();

    if (error || !profile) {
      return jsonError("Contact not found", 404);
    }

    const p = profile as unknown as Record<string, unknown>;

    // Get email from auth
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(id);
    const email = authUser?.email ?? "";

    // Parallel queries for enrichment
    const [
      sendStatsRes,
      tagsRes,
      conversionsRes,
      enrollmentsRes,
      wfEnrollmentsRes,
      timeline,
    ] = await Promise.all([
      // Email stats
      crmTable(admin, "campaign_sends")
        .select("status, opened_at, clicked_at, bounced_at, unsubscribed_at")
        .eq("recipient_email", email)
        .returns<Array<{
          status: string;
          opened_at: string | null;
          clicked_at: string | null;
          bounced_at: string | null;
          unsubscribed_at: string | null;
        }>>(),
      // Tags
      crmTable(admin, "crm_contact_tags")
        .select("id, tag, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .returns<Array<{ id: string; tag: string; created_at: string }>>(),
      // Conversions
      crmTable(admin, "crm_conversions")
        .select("id, event_name, event_category, value_cents, created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<Array<{
          id: string;
          event_name: string;
          event_category: string;
          value_cents: number;
          created_at: string;
        }>>(),
      // Campaign enrollments
      crmTable(admin, "campaign_enrollments")
        .select("id, campaign_id, status, enrolled_at")
        .eq("recipient_email", email)
        .order("enrolled_at", { ascending: false })
        .limit(10)
        .returns<Array<{
          id: string;
          campaign_id: string;
          status: string;
          enrolled_at: string;
        }>>(),
      // Workflow enrollments
      crmTable(admin, "crm_workflow_enrollments")
        .select("id, workflow_id, status, enrolled_at, completed_at")
        .eq("email", email)
        .order("enrolled_at", { ascending: false })
        .limit(10)
        .returns<Array<{
          id: string;
          workflow_id: string;
          status: string;
          enrolled_at: string;
          completed_at: string | null;
        }>>(),
      // Activity timeline
      getContactTimeline(admin, { userId: id, limit: 50 }),
    ]);

    const sends = sendStatsRes.data ?? [];
    const emailStats = {
      total_sent: sends.filter((s) => s.status === "sent").length,
      total_opened: sends.filter((s) => s.opened_at).length,
      total_clicked: sends.filter((s) => s.clicked_at).length,
      total_bounced: sends.filter((s) => s.bounced_at).length,
      total_unsubscribed: sends.filter((s) => s.unsubscribed_at).length,
    };

    const convRows = conversionsRes.data ?? [];
    const totalConversionValue = convRows.reduce((sum, c) => sum + (c.value_cents ?? 0), 0);

    return jsonOk({
      contact: {
        id: p.id,
        email,
        display_name: p.display_name,
        role: p.role,
        phone_number: p.phone_number,
        sms_opt_in: p.sms_opt_in,
        created_at: p.created_at,
      },
      email_stats: emailStats,
      tags: (tagsRes.data ?? []).map((t) => t.tag),
      conversions: {
        items: convRows,
        total_value_cents: totalConversionValue,
        total_count: convRows.length,
      },
      campaign_enrollments: enrollmentsRes.data ?? [],
      workflow_enrollments: wfEnrollmentsRes.data ?? [],
      timeline,
    });
  } catch (err) {
    console.error("[crm/contacts] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return jsonError(`Failed to fetch contact: ${msg}`, 500);
  }
}

/**
 * PATCH /api/admin/crm/contacts/[id]
 *
 * Update contact tags.
 * Body: { add_tags?: string[], remove_tags?: string[] }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  // Get current user for audit
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    // Add tags
    if (Array.isArray(body.add_tags)) {
      for (const tag of body.add_tags) {
        const normalizedTag = String(tag).toLowerCase().trim();
        if (!normalizedTag) continue;

        await crmTable(admin, "crm_contact_tags")
          .upsert(
            {
              user_id: id,
              tag: normalizedTag,
              added_by: user?.id ?? null,
            },
            { onConflict: "user_id,tag" }
          );
      }
    }

    // Remove tags
    if (Array.isArray(body.remove_tags)) {
      for (const tag of body.remove_tags) {
        await crmTable(admin, "crm_contact_tags")
          .delete()
          .eq("user_id", id)
          .eq("tag", String(tag).toLowerCase().trim());
      }
    }

    return jsonOk({ success: true });
  } catch (err) {
    console.error("[crm/contacts] Tag update error:", err);
    return jsonError("Failed to update tags", 500);
  }
}
