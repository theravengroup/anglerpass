import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateSession } from "@/lib/supabase/middleware";
import { getRoleHomePath } from "@/types/roles";

// ─── Route Classification ───────────────────────────────────────────

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/landowner",
  "/club",
  "/angler",
  "/admin",
  "/guide",
  "/corporate",
];

/** Public marketing pages whose paths happen to start with protected prefixes */
const PUBLIC_OVERRIDES = new Set(["/landowners", "/clubs", "/anglers", "/guides", "/corporates"]);

const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

function isPublicOverride(pathname: string): boolean {
  for (const p of PUBLIC_OVERRIDES) {
    if (pathname.startsWith(p)) return true;
  }
  return false;
}

function isProtectedRoute(pathname: string): boolean {
  if (isPublicOverride(pathname)) return false;
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAuthRoute(pathname: string): boolean {
  for (const r of AUTH_ROUTES) {
    if (pathname === r || pathname.startsWith(r + "/")) return true;
  }
  return false;
}

// ─── Profile helper (service-role client to bypass RLS) ─────────────
// The cookie-based client can fail to resolve auth.uid() in middleware,
// causing profile queries to return null. Use the service-role client
// which bypasses RLS entirely — same approach as getProfile().

interface ProfileSlice {
  role: string;
  suspended_at: string | null;
}

function getMiddlewareAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchProfileSlice(
  userId: string
): Promise<ProfileSlice | null> {
  const admin = getMiddlewareAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role, suspended_at")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[middleware] Profile fetch error:", error.message);
    return null;
  }

  return data as ProfileSlice | null;
}

// ─── Middleware ──────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // ── Unauthenticated user → redirect to login ──
  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!user) return response;

  // ── Authenticated user on auth pages → redirect to role home ──
  if (isAuthRoute(pathname)) {
    const profile = await fetchProfileSlice(user.id);
    // Only redirect if we have a confirmed profile; otherwise let them
    // stay on the auth page so the dashboard layout can handle setup.
    if (profile?.role) {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(profile.role);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ── Protected route checks (suspension, admin role) ──
  if (isProtectedRoute(pathname)) {
    const profile = await fetchProfileSlice(user.id);

    // Suspended users → redirect (avoid loop on /suspended itself)
    if (profile?.suspended_at && pathname !== "/suspended") {
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      return NextResponse.redirect(url);
    }

    // Admin route → verify admin role
    if (pathname.startsWith("/admin") && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Admin user on non-admin routes → redirect to admin panel
    if (profile?.role === "admin" && !pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|auth/callback|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
