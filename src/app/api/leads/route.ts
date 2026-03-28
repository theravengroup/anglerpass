import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validations/leads";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, interestType, message, source, type } =
      result.data;

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      supabaseUrl === "your-supabase-url" ||
      serviceRoleKey === "your-supabase-service-role-key"
    ) {
      // Graceful degradation: log to console when Supabase is not configured
      console.log("[leads] Supabase not configured. Lead captured:", {
        firstName,
        lastName,
        email,
        interestType,
        type,
        source,
      });
      return NextResponse.json({ success: true });
    }

    // Dynamic import to avoid errors when env vars are missing
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { error } = await supabase.from("leads").insert({
      first_name: firstName,
      last_name: lastName ?? null,
      email,
      interest_type: interestType,
      type: type ?? "waitlist",
      message: message ?? null,
      source: source ?? "homepage",
    });

    if (error) {
      // Handle duplicate email+type gracefully
      if (error.code === "23505") {
        return NextResponse.json({ success: true });
      }

      console.error("[leads] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[leads] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
