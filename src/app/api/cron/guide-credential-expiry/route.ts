import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { checkCredentialExpiry } from "@/lib/guide-verification";
import {
  notifyGuideCredentialExpiring,
  notifyGuideCredentialExpired,
  notifyGuideAutoSuspended,
  notifyGuideAutoReinstated,
} from "@/lib/notifications";

/**
 * POST: Check guide credential expiration dates.
 *
 * Runs daily via Vercel Cron. Handles:
 * - Warning emails at 60/30/7 days before expiry
 * - Auto-suspend on expiry (suspension_type = 'credential_expiry')
 * - Auto-reinstate when suspended guide's credentials are all valid
 *
 * Protected by CRON_SECRET in the Authorization header.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();

  try {
    // Fetch all live and credential-expiry-suspended guides
    const { data: guides, error } = await admin
      .from("guide_profiles")
      .select("id, user_id, status, suspension_type")
      .in("status", ["live", "suspended"]);

    if (error) {
      console.error("[cron/guide-credential-expiry] Fetch error:", error);
      return jsonError("Failed to fetch guides", 500);
    }

    let warned = 0;
    let suspended = 0;
    let reinstated = 0;

    for (const guide of guides ?? []) {
      const { expired, expiringSoon } = await checkCredentialExpiry(
        admin,
        guide.id
      );

      if (guide.status === "live") {
        // Send expiring-soon warnings
        for (const cred of expiringSoon) {
          if ([60, 30, 7].includes(cred.daysLeft)) {
            await notifyGuideCredentialExpiring(admin, {
              guideUserId: guide.user_id,
              credential: cred.credential,
              daysLeft: cred.daysLeft,
            });
            warned++;
          }
        }

        // Auto-suspend if any credential has expired
        if (expired.length > 0) {
          await admin
            .from("guide_profiles")
            .update({
              status: "suspended",
              suspension_type: "credential_expiry",
              suspended_reason: `Expired: ${expired.join(", ")}`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", guide.id);

          await admin.from("guide_verification_events").insert({
            guide_id: guide.id,
            event_type: "auto_suspended",
            old_status: "live",
            new_status: "suspended",
            metadata: { expired_credentials: expired },
          });

          await notifyGuideAutoSuspended(admin, {
            guideUserId: guide.user_id,
            expiredCredentials: expired,
          });

          await notifyGuideCredentialExpired(admin, {
            guideUserId: guide.user_id,
            credential: expired[0],
          });

          suspended++;
        }
      } else if (
        guide.status === "suspended" &&
        guide.suspension_type === "credential_expiry"
      ) {
        // Check if all credentials are now valid — auto-reinstate
        if (expired.length === 0) {
          await admin
            .from("guide_profiles")
            .update({
              status: "live",
              suspension_type: null,
              suspended_reason: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", guide.id);

          await admin.from("guide_verification_events").insert({
            guide_id: guide.id,
            event_type: "auto_reinstated",
            old_status: "suspended",
            new_status: "live",
            metadata: { reason: "All credentials renewed" },
          });

          await notifyGuideAutoReinstated(admin, {
            guideUserId: guide.user_id,
          });

          reinstated++;
        }
      }
    }

    return jsonOk({
      processed: (guides ?? []).length,
      warned,
      suspended,
      reinstated,
    });
  } catch (err) {
    console.error("[cron/guide-credential-expiry] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
