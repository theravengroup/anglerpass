import { requireAuth, jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageStatus } from "@/lib/compass/usage";
import {
  CREDIT_PACKS,
  suggestPack,
} from "@/lib/constants/compass-usage";

/**
 * GET /api/compass/usage
 * Returns current usage status, available packs, and a suggested pack.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, roles")
    .eq("id", auth.user.id)
    .maybeSingle();

  const userRoles: string[] = profile?.roles ?? [profile?.role ?? "angler"];
  const usage = await getUsageStatus(auth.user.id, userRoles);

  // Calculate suggested pack based on projected shortfall
  let suggestedPack: string | null = null;
  if (usage.monthlyLimit !== null && !usage.isUnlimited) {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const remainingDays = daysInMonth - dayOfMonth;

    if (dayOfMonth > 3 && usage.monthlyUsed > 0) {
      const dailyRate = usage.monthlyUsed / dayOfMonth;
      const projectedTotal = usage.monthlyUsed + dailyRate * remainingDays;
      const shortfall = Math.ceil(
        projectedTotal - usage.monthlyLimit - usage.creditBalance
      );
      if (shortfall > 0) {
        suggestedPack = suggestPack(shortfall).key;
      }
    }
  }

  return jsonOk({
    ...usage,
    packs: CREDIT_PACKS,
    suggestedPack,
  });
}
