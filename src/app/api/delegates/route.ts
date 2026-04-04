import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { delegateInviteSchema } from "@/lib/validations/permissions";
import { auditLog, AuditAction } from "@/lib/permissions";

/**
 * GET /api/delegates
 *
 * List delegates for the current angler, or list principals
 * if the user is a delegate for someone.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    const admin = createAdminClient();

    if (view === "principals") {
      const { data: delegations, error } = await createAdminClient().from("angler_delegates")
        .select("id, angler_id, access_level, status, granted_at, accepted_at")
        .eq("delegate_id", user.id)
        .in("status", ["active", "pending"]);

      if (error) {
        console.error("[delegates] Principals fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
      }

      const anglerIds = (delegations ?? []).map((d) => d.angler_id);
      const { data: profiles } = anglerIds.length > 0
        ? await admin.from("profiles").select("id, display_name").in("id", anglerIds)
        : { data: [] };

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p.display_name])
      );

      const enriched = (delegations ?? []).map((d) => ({
        ...d,
        angler_name: profileMap.get(d.angler_id) ?? "Unknown",
      }));

      return NextResponse.json({ principals: enriched });
    }

    // Default: show delegates for this angler
    const { data: delegates, error } = await createAdminClient().from("angler_delegates")
      .select("id, delegate_id, delegate_email, access_level, status, granted_at, accepted_at, revoked_at")
      .eq("angler_id", user.id)
      .order("granted_at", { ascending: false });

    if (error) {
      console.error("[delegates] Delegates fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const delegateIds = (delegates ?? [])
      .filter((d) => d.delegate_id != null)
      .map((d) => d.delegate_id as string);

    const { data: profiles } = delegateIds.length > 0
      ? await admin.from("profiles").select("id, display_name").in("id", delegateIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name])
    );

    const enriched = (delegates ?? []).map((d) => ({
      ...d,
      delegate_name: d.delegate_id ? profileMap.get(d.delegate_id) ?? null : null,
    }));

    return NextResponse.json({ delegates: enriched });
  } catch (err) {
    console.error("[delegates] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/delegates
 *
 * Invite a delegate. The angler provides an email and access level.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = delegateInviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, access_level } = result.data;
    const admin = createAdminClient();

    if (user.email === email) {
      return NextResponse.json(
        { error: "You cannot add yourself as a delegate" },
        { status: 400 }
      );
    }

    // Check if delegate already exists by email
    const { data: existingByEmail } = await createAdminClient().from("angler_delegates")
      .select("id, status")
      .eq("angler_id", user.id)
      .eq("delegate_email", email)
      .single();

    if (existingByEmail && existingByEmail.status !== "revoked") {
      return NextResponse.json(
        { error: "This person is already a delegate or has a pending invitation" },
        { status: 409 }
      );
    }

    // Look up user by email
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const targetUser = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (targetUser) {
      const { data: existingById } = await createAdminClient().from("angler_delegates")
        .select("id, status")
        .eq("angler_id", user.id)
        .eq("delegate_id", targetUser.id)
        .single();

      if (existingById && existingById.status !== "revoked") {
        return NextResponse.json(
          { error: "This person is already a delegate" },
          { status: 409 }
        );
      }
    }

    const delegateData = {
      angler_id: user.id,
      delegate_id: targetUser?.id ?? null,
      delegate_email: email,
      access_level,
      status: targetUser ? "active" : "pending",
      granted_at: new Date().toISOString(),
      accepted_at: targetUser ? new Date().toISOString() : null,
      revoked_at: null,
    };

    // Reactivate if revoked
    if (existingByEmail?.status === "revoked") {
      const { data: delegate, error } = await createAdminClient().from("angler_delegates")
        .update(delegateData)
        .eq("id", existingByEmail.id)
        .select()
        .single();

      if (error) {
        console.error("[delegates] Update error:", error);
        return NextResponse.json({ error: "Failed to update delegate" }, { status: 500 });
      }

      auditLog({
        actor_id: user.id,
        action: AuditAction.DELEGATE_ADDED,
        entity_type: "angler_delegate",
        entity_id: delegate.id,
        new_data: { email, access_level, reactivated: true },
        scope: "consumer",
      }).catch((err) => console.error("[delegates] Audit error:", err));

      return NextResponse.json({ delegate }, { status: 200 });
    }

    const { data: delegate, error } = await createAdminClient().from("angler_delegates")
      .insert(delegateData)
      .select()
      .single();

    if (error) {
      console.error("[delegates] Insert error:", error);
      return NextResponse.json({ error: "Failed to create delegate" }, { status: 500 });
    }

    auditLog({
      actor_id: user.id,
      action: AuditAction.DELEGATE_ADDED,
      entity_type: "angler_delegate",
      entity_id: delegate.id,
      new_data: { email, access_level, linked: !!targetUser },
      scope: "consumer",
    }).catch((err) => console.error("[delegates] Audit error:", err));

    return NextResponse.json({ delegate }, { status: 201 });
  } catch (err) {
    console.error("[delegates] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
