import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getRoleHomePath } from "@/types/roles";

// ─── Route Classification ───────────────────────────────────────────

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/landowner",
  "/club",
  "/angler",
  "/admin",
];

/** Public marketing pages whose paths happen to start with protected prefixes */
const PUBLIC_OVERRIDES = new Set(["/landowners", "/clubs", "/anglers"]);

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

// ─── Profile helper (single query, reused) ──────────────────────────

interface ProfileSlice {
  role: string;
  suspended_at: string | null;
}

async function fetchProfileSlice(
  supabase: Awaited<ReturnType<typeof updateSession>>["supabase"],
  userId: string
): Promise<ProfileSlice | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, suspended_at")
    .eq("id", userId)
    .returns<ProfileSlice[]>()
    .single();

  if (error) {
    console.error("[middleware] Profile fetch error:", error.message);
    return null;
  }

  return data;
}

// ─── Middleware ──────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { supabase, response, user } = await updateSession(request);
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
    const profile = await fetchProfileSlice(supabase, user.id);
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
    const profile = await fetchProfileSlice(supabase, user.id);

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
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|auth/callback|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
