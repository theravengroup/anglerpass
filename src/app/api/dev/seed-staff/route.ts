import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Dev-only endpoint that creates platform staff users for each role.
 * GET /api/dev/seed-staff
 */

const STAFF_USERS = [
  {
    email: "ops@anglerpass.com",
    password: "AnglerPass-Ops-2026!",
    displayName: "Ops Admin",
    staffRole: "ops_admin",
  },
  {
    email: "support-agent@anglerpass.com",
    password: "AnglerPass-Support-2026!",
    displayName: "Support Agent",
    staffRole: "support_agent",
  },
  {
    email: "finance@anglerpass.com",
    password: "AnglerPass-Finance-2026!",
    displayName: "Finance Admin",
    staffRole: "finance_admin",
  },
  {
    email: "compliance@anglerpass.com",
    password: "AnglerPass-Compliance-2026!",
    displayName: "Compliance Admin",
    staffRole: "compliance_admin",
  },
  {
    email: "readonly@anglerpass.com",
    password: "AnglerPass-Readonly-2026!",
    displayName: "Read-Only Internal",
    staffRole: "readonly_internal",
  },
] as const;

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  const admin = createAdminClient();
  const results: { email: string; staffRole: string; status: string }[] = [];

  for (const staff of STAFF_USERS) {
    try {
      // Find or create auth user
      const { data: listData } = await admin.auth.admin.listUsers();
      let user = listData?.users?.find((u) => u.email === staff.email);

      if (!user) {
        const { data: created, error: createErr } =
          await admin.auth.admin.createUser({
            email: staff.email,
            password: staff.password,
            email_confirm: true,
            user_metadata: {
              display_name: staff.displayName,
              role: "admin",
            },
          });

        if (createErr || !created.user) {
          results.push({
            email: staff.email,
            staffRole: staff.staffRole,
            status: `failed to create: ${createErr?.message}`,
          });
          continue;
        }
        user = created.user;
      } else {
        // Update password in case it changed
        await admin.auth.admin.updateUserById(user.id, {
          password: staff.password,
          user_metadata: {
            display_name: staff.displayName,
            role: "admin",
          },
        });
      }

      // Ensure profile exists with admin role
      const allRoles = ["admin", "landowner", "club_admin", "angler", "guide"];
      const { error: updateErr } = await admin
        .from("profiles")
        .update({
          display_name: staff.displayName,
          role: "admin",
          roles: allRoles,
        })
        .eq("id", user.id);

      if (updateErr) {
        await admin.from("profiles").insert({
          id: user.id,
          display_name: staff.displayName,
          role: "admin",
          roles: allRoles,
        });
      }

      // Set platform_staff role
      const { data: updated } = await admin
        .from("platform_staff")
        .update({ role: staff.staffRole, revoked_at: null })
        .eq("user_id", user.id)
        .select();

      if (!updated?.length) {
        await admin.from("platform_staff").insert({
          user_id: user.id,
          role: staff.staffRole,
          granted_by: user.id,
        });
      }

      results.push({
        email: staff.email,
        staffRole: staff.staffRole,
        status: "ok",
      });
    } catch (err) {
      results.push({
        email: staff.email,
        staffRole: staff.staffRole,
        status: `error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return NextResponse.json({ results });
}
