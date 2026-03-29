import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET: Get or create calendar token for a property
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get existing token or create one
    let { data: tokenRecord } = await admin
      .from("calendar_tokens")
      .select("token")
      .eq("property_id", id)
      .single();

    if (!tokenRecord) {
      const { data: newToken, error } = await admin
        .from("calendar_tokens")
        .insert({ property_id: id })
        .select("token")
        .single();

      if (error) {
        console.error("[calendar-token] Insert error:", error);
        return NextResponse.json(
          { error: "Failed to create calendar token" },
          { status: 500 }
        );
      }

      tokenRecord = newToken;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const feedUrl = `${siteUrl}/api/properties/${id}/calendar.ics?token=${tokenRecord!.token}`;

    return NextResponse.json({ token: tokenRecord!.token, feed_url: feedUrl });
  } catch (err) {
    console.error("[calendar-token] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Regenerate calendar token (invalidates old subscriptions)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!property || property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete existing token
    await admin
      .from("calendar_tokens")
      .delete()
      .eq("property_id", id);

    // Create new one
    const { data: newToken, error } = await admin
      .from("calendar_tokens")
      .insert({ property_id: id })
      .select("token")
      .single();

    if (error) {
      console.error("[calendar-token] Regenerate error:", error);
      return NextResponse.json(
        { error: "Failed to regenerate token" },
        { status: 500 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpass.com";
    const feedUrl = `${siteUrl}/api/properties/${id}/calendar.ics?token=${newToken!.token}`;

    return NextResponse.json({ token: newToken!.token, feed_url: feedUrl });
  } catch (err) {
    console.error("[calendar-token] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
