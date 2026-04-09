import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_PHOTOS } from "@/lib/validations/properties";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB server-side limit

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const propertyId = formData.get("propertyId") as string | null;

    if (!file || !propertyId) {
      return jsonError("File and propertyId are required", 400);
    }

    // Server-side file size check
    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File is too large. Maximum size is 5MB.", 413);
    }

    // Verify property ownership and check current photo count
    const admin = createAdminClient();
    const { data: property } = await admin
      .from("properties")
      .select("id, owner_id, photos")
      .eq("id", propertyId)
      .single();

    if (!property || property.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const currentCount = (property.photos as string[])?.length ?? 0;
    if (currentCount >= MAX_PHOTOS) {
      return jsonError(`Maximum of ${MAX_PHOTOS} photos allowed`, 400);
    }

    // Upload to Supabase Storage
    // Path: {user_id}/{property_id}/{timestamp}-{random}.webp
    const fileName = `${user.id}/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

    const { error: uploadError } = await admin.storage
      .from("property-photos")
      .upload(fileName, file, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      console.error("[photos] Upload error:", uploadError);
      return jsonError("Failed to upload photo", 500);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = admin.storage.from("property-photos").getPublicUrl(fileName);

    return jsonOk({ url: publicUrl });
  } catch (err) {
    console.error("[photos] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
