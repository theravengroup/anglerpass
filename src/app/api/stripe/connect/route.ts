import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_SECRET = () => process.env.STRIPE_SECRET_KEY!;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";

// Return paths after Stripe onboarding, keyed by entity type
// Return to main dashboard after onboarding so the PayoutSetup card updates
const RETURN_PATHS: Record<string, string> = {
  guide: "/guide",
  landowner: "/landowner",
  club: "/club",
};

// ─── Helpers: raw Stripe API via fetch ──────────────────────────────

async function stripePost(path: string, body: Record<string, string>) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Stripe API error");
  }
  return res.json();
}

async function stripeGet(path: string) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET()}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Stripe API error");
  }
  return res.json();
}

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
    // Find the club this user owns
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const type = body.type as EntityType;

    if (!type || !["guide", "landowner", "club"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be guide, landowner, or club." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const entity = await resolveEntity(admin, user.id, type);

    if (!entity) {
      return NextResponse.json(
        { error: `No ${type} record found for this user.` },
        { status: 404 }
      );
    }

    // Create a Connect Express account if one doesn't already exist
    let accountId = entity.stripeAccountId;

    if (!accountId) {
      const account = await stripePost("/accounts", {
        type: "express",
        email: user.email ?? "",
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
      });
      accountId = account.id as string;

      // Store the account ID in the appropriate table
      await admin
        .from(entity.table)
        .update({ stripe_connect_account_id: accountId })
        .eq(entity.idColumn, entity.idValue);
    }

    // Create an Account Link for onboarding
    const returnPath = RETURN_PATHS[type] ?? "/dashboard";
    const accountLink = await stripePost("/account_links", {
      account: accountId,
      type: "account_onboarding",
      return_url: `${SITE_URL}${returnPath}?stripe_onboarding=complete`,
      refresh_url: `${SITE_URL}${returnPath}?stripe_onboarding=refresh`,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("[stripe/connect] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe onboarding link" },
      { status: 500 }
    );
  }
}

// ─── GET: Check onboarding status ───────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as EntityType;

    if (!type || !["guide", "landowner", "club"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be guide, landowner, or club." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const entity = await resolveEntity(admin, user.id, type);

    if (!entity) {
      return NextResponse.json({
        onboarded: false,
        hasAccount: false,
      });
    }

    if (!entity.stripeAccountId) {
      return NextResponse.json({
        onboarded: false,
        hasAccount: false,
      });
    }

    // Retrieve the account from Stripe to check charges_enabled
    const account = await stripeGet(`/accounts/${entity.stripeAccountId}`);
    const onboarded = account.charges_enabled === true;

    // Update the DB if status changed
    if (onboarded !== entity.onboarded) {
      await admin
        .from(entity.table)
        .update({ stripe_connect_onboarded: onboarded })
        .eq(entity.idColumn, entity.idValue);
    }

    return NextResponse.json({
      onboarded,
      hasAccount: true,
      accountId: entity.stripeAccountId,
    });
  } catch (err) {
    console.error("[stripe/connect] GET error:", err);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}
