import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createUntypedAdmin } from "@/lib/supabase/untyped";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { z } from "zod";
import { createHash } from "crypto";

const clickSchema = z.object({
  productId: z.string().uuid(),
  source: z.enum(["compass", "gear_page", "email", "other"]).default("compass"),
  context: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  // Rate limit: 30 clicks per minute per IP
  const limited = rateLimit("affiliate-click", getClientIp(request), 30, 60_000);
  if (limited) return jsonError("Too many requests", 429);

  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON", 400);

  const parsed = clickSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request", 400);

  const { productId, source, context } = parsed.data;

  // Get user if authenticated (clicks work for anonymous too)
  const auth = await requireAuth();
  const userId = auth?.user?.id ?? null;

  // Hash IP for fraud detection (never store raw IPs)
  const rawIp = getClientIp(request);
  const ipHash = rawIp
    ? createHash("sha256").update(rawIp).digest("hex").slice(0, 16)
    : null;

  const userAgent = request.headers.get("user-agent") ?? null;

  const admin = createUntypedAdmin();
  const { error } = await admin.from("affiliate_clicks").insert({
    product_id: productId,
    user_id: userId,
    source,
    context,
    ip_hash: ipHash,
    user_agent: userAgent,
  });

  if (error) {
    console.error("[affiliate/click] Insert error:", error.message);
    return jsonError("Failed to record click", 500);
  }

  return jsonOk({ ok: true });
}
