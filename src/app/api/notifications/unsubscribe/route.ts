import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";

/**
 * GET /api/notifications/unsubscribe?token=xxx
 *
 * One-click unsubscribe — disables all email notifications for the user.
 * Returns an HTML page confirming the action (CAN-SPAM compliant).
 *
 * POST /api/notifications/unsubscribe
 * Body: { token: "xxx" }
 *
 * RFC 8058 List-Unsubscribe-Post compliant one-click unsubscribe.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return htmlResponse(
      "Invalid Link",
      "This unsubscribe link is invalid or expired. You can manage your email preferences in your <a href=\"/dashboard/settings\">account settings</a>.",
      400
    );
  }

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return htmlResponse(
      "Invalid Link",
      "This unsubscribe link is invalid or expired. You can manage your email preferences in your <a href=\"/dashboard/settings\">account settings</a>.",
      400
    );
  }

  await disableAllEmails(userId);

  return htmlResponse(
    "Unsubscribed",
    "You've been unsubscribed from all AnglerPass email notifications. You can re-enable specific emails anytime in your <a href=\"/dashboard/settings\">account settings</a>.",
    200
  );
}

export async function POST(request: NextRequest) {
  try {
    // Support both form-encoded (RFC 8058) and JSON bodies
    const contentType = request.headers.get("content-type") ?? "";
    let token: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      token = formData.get("List-Unsubscribe")?.toString() ?? null;
      // Fallback: some providers send the token directly
      if (!token) {
        token = request.nextUrl.searchParams.get("token");
      }
    } else {
      const body = await request.json().catch(() => null);
      token = body?.token ?? null;
    }

    if (!token) {
      // For RFC 8058, the token might be in the URL
      token = request.nextUrl.searchParams.get("token");
    }

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const userId = verifyUnsubscribeToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await disableAllEmails(userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

async function disableAllEmails(userId: string) {
  const admin = createAdminClient();

  // Upsert: set all email flags to false
  const { error } = await admin.from("notification_preferences").upsert(
    {
      user_id: userId,
      email_booking_requested: false,
      email_booking_confirmed: false,
      email_booking_declined: false,
      email_booking_cancelled: false,
      email_member_invited: false,
      email_member_approved: false,
      email_property_access: false,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[unsubscribe] DB error:", error);
  }
}

function htmlResponse(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - AnglerPass</title>
  <style>
    body { font-family: Georgia, serif; max-width: 560px; margin: 60px auto; padding: 0 20px; color: #1e1e1a; }
    h1 { font-size: 24px; font-weight: 500; margin-bottom: 12px; }
    p { font-size: 16px; line-height: 1.7; color: #5a5a52; }
    a { color: #3a6b7c; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
  <p style="margin-top: 32px; font-size: 14px; color: #9a9a8e;">&mdash; The AnglerPass Team</p>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
