import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRoleHomePath } from "@/types/roles";
import { sendWelcomeEmail } from "@/lib/welcome-emails";

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

          // Send welcome email 1 for new signups (step = 0 means never sent)
          await sendWelcomeEmailIfNew(user.id);
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

  } catch (err) {
    // Don't fail the auth flow if linking fails
    console.error("[auth/callback] Error linking memberships:", err);
  }
}

/**
 * Send the first welcome email if this user has not received one yet.
 * Runs on every auth callback but only sends once (checks welcome_email_step).
 */
async function sendWelcomeEmailIfNew(userId: string) {
  try {
    const admin = createAdminClient();

    // welcome_email_step is added by migration but not in generated types
    const { data: profile } = await admin
      .from("profiles")
      .select("role, welcome_email_step")
      .eq("id", userId)
      .returns<Array<{ role: string; welcome_email_step: number }>>()
      .single();

    if (!profile) return;

    // Only send if step is 0 (never sent)
    if (profile.welcome_email_step > 0) return;

    await sendWelcomeEmail(admin, userId, profile.role, 1);
  } catch (err) {
    // Don't fail the auth flow if welcome email fails
    console.error("[auth/callback] Error sending welcome email:", err);
  }
}
