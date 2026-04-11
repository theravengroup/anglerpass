import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/api/helpers";
import { PLATFORM_ROLES } from "@/lib/permissions/constants";
import type { PlatformRole } from "@/lib/permissions/constants";

const TEST_EMAIL = "dev-test@anglerpass.local";
const TEST_PASSWORD = "dev-test-password-2024";

/**
 * Dev-only login endpoint. Creates a test user if needed,
 * signs them in, sets auth cookies, and redirects to the dashboard.
 *
 * GET  /api/dev/login                        → login as landowner
 * GET  /api/dev/login?role=admin             → login as super_admin
 * GET  /api/dev/login?role=admin&staff=support_agent → login as support_agent
 * POST /api/dev/login                        → { role: "landowner", staff: "support_agent" }
 */
export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") ?? "landowner";
  const staff = request.nextUrl.searchParams.get("staff") ?? null;
  return devLogin(role, staff);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const role = (body as { role?: string }).role ?? "landowner";
  const staff = (body as { staff?: string }).staff ?? null;
  return devLogin(role, staff);
}

async function devLogin(role: string, staffRole: string | null) {
  if (process.env.NODE_ENV !== "development") {
    return jsonError("Not available", 404);
  }

  const admin = createAdminClient();

  // Find or create the test user
  const { data: listData } = await admin.auth.admin.listUsers();
  let user = listData?.users?.find((u) => u.email === TEST_EMAIL);

  if (!user) {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Dev Test User" },
      });

    if (createErr || !created.user) {
      return jsonError(`Failed to create test user: ${createErr?.message}`, 500);
    }
    user = created.user;
  }

  // Update user_metadata so self-heal in getProfile uses the correct role
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { full_name: "Dev Test User", role, display_name: "Dev Test User" },
  });

  // Ensure profile exists with the requested role
  // Admin gets all roles so they can switch; others get just their role
  const allRoles = role === "admin"
    ? ["admin", "landowner", "club_admin", "angler", "guide", "affiliate"]
    : [role];

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ display_name: "Dev Test User", role, roles: allRoles })
    .eq("id", user.id);

  if (updateErr) {
    const { error: insertErr } = await admin.from("profiles").insert({
      id: user.id,
      display_name: "Dev Test User",
      role,
      roles: allRoles,
    });
    if (insertErr) {
      return jsonError(`Failed to set profile: ${insertErr.message}`, 500);
    }
  }

  // Set platform_staff role for admin users
  if (role === "admin") {
    const resolvedStaffRole: PlatformRole =
      staffRole && (PLATFORM_ROLES as readonly string[]).includes(staffRole)
        ? (staffRole as PlatformRole)
        : "super_admin";

    // Try update first, then insert if no rows matched
    const { data: updated } = await admin
      .from("platform_staff")
      .update({ role: resolvedStaffRole, revoked_at: null })
      .eq("user_id", user.id)
      .select();

    if (!updated?.length) {
      await admin.from("platform_staff").insert({
        user_id: user.id,
        role: resolvedStaffRole,
        granted_by: user.id,
      });
    }
  }

  // Sign in with password to get session tokens
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const signInRes = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    }
  );

  if (!signInRes.ok) {
    const err = await signInRes.text();
    return jsonError(`Failed to sign in: ${err}`, 500);
  }

  const tokens = await signInRes.json();

  // Extract project ref from URL for cookie name (e.g. "sb-<ref>-auth-token")
  const projectRef = supabaseUrl
    .replace("https://", "")
    .replace(".supabase.co", "");
  const cookieName = `sb-${projectRef}-auth-token`;

  // Build the session payload that @supabase/ssr expects
  const sessionPayload = JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: "bearer",
    expires_in: tokens.expires_in,
    expires_at: tokens.expires_at,
    user: tokens.user,
  });

  // Supabase SSR splits large cookies into chunks of ~3180 bytes
  const CHUNK_SIZE = 3180;
  const chunks: string[] = [];
  for (let i = 0; i < sessionPayload.length; i += CHUNK_SIZE) {
    chunks.push(sessionPayload.slice(i, i + CHUNK_SIZE));
  }

  // Redirect to the role's dashboard
  const redirectPath = role === "club_admin" ? "/club" : `/${role}`;
  const response = NextResponse.redirect(
    new URL(redirectPath, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  );

  // Set chunked cookies
  const cookieOpts = {
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "lax" as const,
    maxAge: 60 * 60, // 1 hour
  };

  if (chunks.length === 1) {
    response.cookies.set(cookieName, chunks[0], cookieOpts);
  } else {
    chunks.forEach((chunk, i) => {
      response.cookies.set(`${cookieName}.${i}`, chunk, cookieOpts);
    });
  }

  return response;
}
