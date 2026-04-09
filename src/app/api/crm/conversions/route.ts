import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { trackConversion } from "@/lib/crm/conversions";
import { z } from "zod";

const trackSchema = z.object({
  event_name: z.string().min(1).max(100),
  category: z
    .enum([
      "signup",
      "booking",
      "purchase",
      "upgrade",
      "referral",
      "engagement",
      "retention",
      "reactivation",
      "other",
    ])
    .optional(),
  value_cents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  // Allow server-side calls to specify user
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
});

/**
 * POST /api/crm/conversions
 *
 * Track a conversion event. Can be called:
 * 1. By authenticated users (auto-resolves user_id/email)
 * 2. By server (with CRON_SECRET auth) passing user_id or email
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();

  // Check auth — either user session or CRON_SECRET
  let userId: string | undefined;
  let email: string | undefined;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
    // Server-side call — user_id or email must be in body
  } else {
    // User session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return jsonError("Unauthorized", 401);
    userId = user.id;
    email = user.email ?? undefined;
  }

  const body = await request.json();
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data } = parsed;

  // Resolve user_id/email
  if (data.user_id) userId = data.user_id;
  if (data.email) email = data.email;

  // If we have userId but no email, resolve it
  if (userId && !email) {
    const { data: { user } } = await admin.auth.admin.getUserById(userId);
    email = user?.email ?? undefined;
  }

  if (!email) {
    return jsonError("Email is required", 400);
  }

  const conversionId = await trackConversion(admin, {
    userId,
    email,
    eventName: data.event_name,
    category: data.category,
    valueCents: data.value_cents,
    currency: data.currency,
    properties: data.properties,
  });

  return jsonOk({ conversion_id: conversionId });
}
