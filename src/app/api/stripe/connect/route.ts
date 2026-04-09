import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createConnectAccount,
  createAccountLink,
  getConnectAccount,
} from "@/lib/stripe/server";
import { SITE_URL } from "@/lib/constants";

// Return paths after Stripe onboarding, keyed by entity type
// Return to main dashboard after onboarding so the PayoutSetup card updates
const RETURN_PATHS: Record<string, string> = {
  guide: "/guide",
  landowner: "/landowner",
  club: "/club",
};

// ─── Resolve the entity's Stripe fields from the correct table ──────

type EntityType = "guide" | "landowner" | "club";

interface EntityRecord {
  table: "guide_profiles" | "profiles" | "clubs";
  idColumn: string;
  idValue: string;
  stripeAccountId: string | null;
  onboarded: boolean;
}

async function resolveEntity(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  type: EntityType
): Promise<EntityRecord | null> {
  if (type === "guide") {
    const { data } = await admin
      .from("guide_profiles")
      .select("id, stripe_connect_account_id, stripe_connect_onboarded")
      .eq("user_id", userId)
      .single();

    if (!data) return null;
    return {
      table: "guide_profiles",
      idColumn: "id",
      idValue: data.id,
      stripeAccountId: data.stripe_connect_account_id,
      onboarded: data.stripe_connect_onboarded,
    };
  }

  if (type === "landowner") {
    const { data } = await admin
      .from("profiles")
      .select("id, stripe_connect_account_id, stripe_connect_onboarded")
      .eq("id", userId)
      .single();

    if (!data) return null;
    return {
      table: "profiles",
      idColumn: "id",
      idValue: data.id,
      stripeAccountId: data.stripe_connect_account_id,
      onboarded: data.stripe_connect_onboarded,
    };
  }

  if (type === "club") {
    const { data } = await admin
      .from("clubs")
      .select("id, stripe_connect_account_id, stripe_connect_onboarded")
      .eq("owner_id", userId)
      .limit(1)
      .single();

    if (!data) return null;
    return {
      table: "clubs",
      idColumn: "id",
      idValue: data.id,
      stripeAccountId: data.stripe_connect_account_id,
      onboarded: data.stripe_connect_onboarded,
    };
  }

  return null;
}

// ─── POST: Create Stripe Connect account + onboarding link ──────────

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const type = body.type as EntityType;

    if (!type || !["guide", "landowner", "club"].includes(type)) {
      return jsonError("Invalid type. Must be guide, landowner, or club.", 400);
    }

    const admin = createAdminClient();
    const entity = await resolveEntity(admin, user.id, type);

    if (!entity) {
      return jsonError(`No ${type} record found for this user.`, 404);
    }

    // Create a Connect Express account if one doesn't already exist
    let accountId = entity.stripeAccountId;

    if (!accountId) {
      const account = await createConnectAccount(user.email ?? "");
      accountId = account.id;

      // Store the account ID in the appropriate table
      await admin
        .from(entity.table)
        .update({ stripe_connect_account_id: accountId })
        .eq(entity.idColumn, entity.idValue);
    }

    // Create an Account Link for onboarding
    const returnPath = RETURN_PATHS[type] ?? "/dashboard";
    const accountLink = await createAccountLink(
      accountId,
      `${SITE_URL}${returnPath}?stripe_onboarding=complete`,
      `${SITE_URL}${returnPath}?stripe_onboarding=refresh`
    );

    return jsonOk({ url: accountLink.url });
  } catch (err) {
    console.error("[stripe/connect] POST error:", err);
    return jsonError("Failed to create Stripe onboarding link", 500);
  }
}

// ─── GET: Check onboarding status ───────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as EntityType;

    if (!type || !["guide", "landowner", "club"].includes(type)) {
      return jsonError("Invalid type. Must be guide, landowner, or club.", 400);
    }

    const admin = createAdminClient();
    const entity = await resolveEntity(admin, user.id, type);

    if (!entity) {
      return jsonOk({
        onboarded: false,
        hasAccount: false,
      });
    }

    if (!entity.stripeAccountId) {
      return jsonOk({
        onboarded: false,
        hasAccount: false,
      });
    }

    // Retrieve the account from Stripe to check charges_enabled
    const account = await getConnectAccount(entity.stripeAccountId);
    const onboarded = account.charges_enabled === true;

    // Update the DB if status changed
    if (onboarded !== entity.onboarded) {
      await admin
        .from(entity.table)
        .update({ stripe_connect_onboarded: onboarded })
        .eq(entity.idColumn, entity.idValue);
    }

    return jsonOk({
      onboarded,
      hasAccount: true,
      accountId: entity.stripeAccountId,
    });
  } catch (err) {
    console.error("[stripe/connect] GET error:", err);
    return jsonError("Failed to check onboarding status", 500);
  }
}
