import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TEST_EMAIL = "dev-test@anglerpass.local";
const TEST_PASSWORD = "dev-test-password-2024";

/**
 * Dev-only login endpoint. Creates a test landowner user if needed,
 * signs them in, sets auth cookies, and redirects to the dashboard.
 *
 * GET  /api/dev/login           → login as landowner
 * GET  /api/dev/login?role=club → login as club_admin
 * POST /api/dev/login           → { role: "landowner" }
 */
export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") ?? "landowner";
  return devLogin(role);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const role = (body as { role?: string }).role ?? "landowner";
  return devLogin(role);
}

async function devLogin(role: string) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not available" }, { status: 404 });
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
      return Response.json(
        { error: "Failed to create test user", detail: createErr?.message },
        { status: 500 }
      );
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
    ? ["admin", "landowner", "club_admin", "angler", "guide"]
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
      return Response.json(
        { error: "Failed to set profile", detail: insertErr.message },
        { status: 500 }
      );
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
    return Response.json(
      { error: "Failed to sign in", detail: err },
      { status: 500 }
    );
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
    new URL(redirectPath, `http://localhost:3001`)
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
