import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { propertySchema } from "@/lib/validations/properties";
import { parseCoordinates } from "@/lib/geo";

export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("properties")
      .select("*")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[properties] List error:", error);
      return jsonError("Failed to fetch properties", 500);
    }

    return jsonOk({ properties: data });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = propertySchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { water_type, coordinates, ...rest } = result.data;
    const { latitude, longitude } = parseCoordinates(coordinates);

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("properties")
      .insert({
        ...rest,
        coordinates,
        water_type: water_type || null,
        latitude,
        longitude,
        owner_id: user.id,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[properties] Insert error:", error);
      return jsonError("Failed to create property", 500);
    }

    return jsonCreated({ property: data });
  } catch (err) {
    console.error("[properties] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
