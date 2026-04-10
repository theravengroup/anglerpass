import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMonthlyLimit,
  WARNING_THRESHOLD,
} from "@/lib/constants/compass-usage";

export interface UsageStatus {
  monthlyUsed: number;
  monthlyLimit: number | null;
  creditBalance: number;
  canSend: boolean;
  isUnlimited: boolean;
  warningReached: boolean;
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get full usage status for a user.
 * Non-blocking: returns permissive defaults if DB fails.
 */
export async function getUsageStatus(
  userId: string,
  roles: string[]
): Promise<UsageStatus> {
  const monthlyLimit = getMonthlyLimit(roles);

  if (monthlyLimit === null) {
    return {
      monthlyUsed: 0,
      monthlyLimit: null,
      creditBalance: 0,
      canSend: true,
      isUnlimited: true,
      warningReached: false,
    };
  }

  try {
    const admin = createAdminClient();
    const period = getCurrentPeriod();

    const [usageResult, creditsResult] = await Promise.all([
      admin
        .from("compass_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("period", period)
        .maybeSingle(),
      admin
        .from("compass_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const monthlyUsed = usageResult.data?.message_count ?? 0;
    const creditBalance = creditsResult.data?.balance ?? 0;

    const overMonthly = monthlyUsed >= monthlyLimit;
    const canSend = !overMonthly || creditBalance > 0;
    const warningReached =
      !overMonthly && monthlyUsed >= monthlyLimit * WARNING_THRESHOLD;

    return {
      monthlyUsed,
      monthlyLimit,
      creditBalance,
      canSend,
      isUnlimited: false,
      warningReached,
    };
  } catch {
    // Non-blocking: allow chat if DB fails (20/hr rate limit still active)
    return {
      monthlyUsed: 0,
      monthlyLimit,
      creditBalance: 0,
      canSend: true,
      isUnlimited: false,
      warningReached: false,
    };
  }
}

/**
 * Record a completed message. Uses atomic DB functions.
 * If monthly allocation exceeded, decrements credits atomically.
 * Fire-and-forget — errors are swallowed.
 */
export async function recordMessage(
  userId: string,
  roles: string[]
): Promise<void> {
  try {
    const admin = createAdminClient();
    const period = getCurrentPeriod();
    const monthlyLimit = getMonthlyLimit(roles);

    // Atomic upsert: inserts with count=1 or increments existing
    const { data: newCount } = await admin.rpc("increment_compass_usage", {
      p_user_id: userId,
      p_period: period,
    });

    // If over monthly limit, deduct one credit
    if (
      monthlyLimit !== null &&
      typeof newCount === "number" &&
      newCount > monthlyLimit
    ) {
      await admin.rpc("decrement_compass_credits", {
        p_user_id: userId,
      });
    }
  } catch {
    // Fire-and-forget: don't break chat if recording fails
  }
}

/**
 * Add purchased credits to a user's balance atomically.
 */
export async function addCredits(
  userId: string,
  messages: number
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("add_compass_credits", {
    p_user_id: userId,
    p_amount: messages,
  });
}
