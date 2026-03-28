import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRoleHomePath } from "@/types/roles";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Determine redirect destination
        let destination = next;
        if (!destination) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .returns<{ role: string }[]>()
              .single();
            destination = profile?.role
              ? getRoleHomePath(profile.role)
              : "/dashboard";
          } else {
            destination = "/dashboard";
          }
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${destination}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(
            `https://${forwardedHost}${destination}`
          );
        } else {
          return NextResponse.redirect(`${origin}${destination}`);
        }
      }
    } catch (err) {
      console.error("[auth/callback] Error exchanging code:", err);
    }
  }

  // Redirect to login on failure
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
