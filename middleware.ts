import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getRoleHomePath } from "@/types/roles";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/landowner",
  "/club",
  "/angler",
  "/admin",
];

// Public marketing pages that start with protected prefixes (plural forms)
const PUBLIC_OVERRIDES = ["/landowners", "/clubs", "/anglers"];
const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(request: NextRequest) {
  const { supabase, response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicOverride = PUBLIC_OVERRIDES.some((p) => pathname.startsWith(p));
  const isProtected =
    !isPublicOverride &&
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // Unauthenticated user trying to access protected route
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to access auth pages - redirect to their role home
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .returns<{ role: string }[]>()
      .single();

    const rolePath = profile?.role
      ? getRoleHomePath(profile.role)
      : "/dashboard";
    const url = request.nextUrl.clone();
    url.pathname = rolePath;
    return NextResponse.redirect(url);
  }

  // For all protected routes, check suspension and role
  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, suspended_at")
      .eq("id", user.id)
      .returns<{ role: string; suspended_at: string | null }[]>()
      .single();

    // Suspended users get redirected to a suspended page
    if (profile?.suspended_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      // Avoid redirect loop
      if (pathname !== "/suspended") {
        return NextResponse.redirect(url);
      }
    }

    // Admin route protection - check role
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
