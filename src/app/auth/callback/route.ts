import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Auto-link pending club memberships by email
          await linkPendingMemberships(user.id, user.email);
        }

        // Determine redirect destination
        let destination = next;
        if (!destination) {
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

/**
 * When a user signs up, check if they have any pending club memberships
 * (invited by email before they had an account) and link them.
 */
async function linkPendingMemberships(
  userId: string,
  email: string | undefined
) {
  if (!email) return;

  try {
    const admin = createAdminClient();

    // Find pending memberships with this email that have no user_id
    const { data: pendingMemberships } = await admin
      .from("club_memberships")
      .select("id")
      .eq("invited_email", email)
      .is("user_id", null);

    if (!pendingMemberships?.length) return;

    // Link each membership to this user
    for (const membership of pendingMemberships) {
      await admin
        .from("club_memberships")
        .update({
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id);
    }

    console.log(
      `[auth/callback] Linked ${pendingMemberships.length} pending membership(s) for ${email}`
    );
  } catch (err) {
    // Don't fail the auth flow if linking fails
    console.error("[auth/callback] Error linking memberships:", err);
  }
}
