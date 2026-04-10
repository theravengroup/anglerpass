import { jsonCreated, jsonError, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CREDENTIAL_TYPES } from "@/lib/validations/guides";

// POST: Upload a credential document to Supabase Storage
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return jsonError("No file provided", 400);
    }

    if (!type || !CREDENTIAL_TYPES.includes(type as typeof CREDENTIAL_TYPES[number])) {
      return jsonError(`Invalid credential type. Must be one of: ${CREDENTIAL_TYPES.join(", ")}`, 400);
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return jsonError("File size must be under 10MB", 400);
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return jsonError("File must be a PDF, JPEG, PNG, or WebP", 400);
    }

    const admin = createAdminClient();

    // Verify user has a guide profile
    const { data: guideProfile } = await admin
      .from("guide_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!guideProfile) {
      return jsonError("Guide profile not found. Create a profile first.", 404);
    }

    // Upload to storage
    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${user.id}/${type}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("guide-credentials")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("[guides/credentials] Upload error:", uploadError);
      return jsonError("Failed to upload file", 500);
    }

    // Get the URL (private bucket — use createSignedUrl for viewing)
    const { data: urlData } = await admin.storage
      .from("guide-credentials")
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    const url = urlData?.signedUrl ?? "";

    // Update the guide profile with the credential URL
    const urlField = `${type}_url`;
    await admin
      .from("guide_profiles")
      .update({
        [urlField]: url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guideProfile.id);

    return jsonCreated({ url, type, path });
  } catch (err) {
    console.error("[guides/credentials] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
