import { type NextRequest, NextResponse } from "next/server";

export async function middleware(_request: NextRequest) {
  // Supabase auth integration will be enabled once env vars are configured.
  // For now, all routes pass through without auth checks.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
