import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB server-side limit

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);
    const { user, supabase } = auth;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonError("File is required", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File is too large. Maximum size is 5MB.", 413);
    }

    // Validate content type
    if (file.type !== "image/webp") {
      return jsonError("Only WebP images are accepted (client should convert first).", 400);
    }

    const admin = createAdminClient();

    // Determine which table to update based on user role
    const { data: profile } = await admin
      .from("profiles")
      .select("role, roles")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return jsonError("Profile not found", 404);
    }

    // Upload to Supabase Storage
    // Path: {user_id}/profile-{timestamp}.webp
    const fileName = `${user.id}/profile-${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(fileName, file, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      console.error("[profile/photo] Upload error:", uploadError);
      return jsonError("Failed to upload photo", 500);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

    // Update avatar_url on the profiles table (all roles)
    await admin
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    // Also update profile_photo_url on guide_profiles if user is a guide
    const roles: string[] = profile.roles ?? [];
    if (roles.includes("guide") || profile.role === "guide") {
      await admin
        .from("guide_profiles")
        .update({ profile_photo_url: publicUrl })
        .eq("user_id", user.id);
    }

    return jsonOk({ url: publicUrl });
  } catch (err) {
    console.error("[profile/photo] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE: Remove profile photo
 */
export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);
    const { user, supabase } = auth;

    const admin = createAdminClient();

    // Get current avatar URL to find storage path
    const { data: profile } = await admin
      .from("profiles")
      .select("avatar_url, role, roles")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return jsonError("Profile not found", 404);
    }

    // Clear avatar_url
    await admin
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    // Clear guide profile photo too if applicable
    const roles: string[] = profile.roles ?? [];
    if (roles.includes("guide") || profile.role === "guide") {
      await admin
        .from("guide_profiles")
        .update({ profile_photo_url: null })
        .eq("user_id", user.id);
    }

    // Try to delete from storage (non-blocking)
    if (profile.avatar_url) {
      try {
        // Extract path from URL: after /profile-photos/
        const match = profile.avatar_url.match(/profile-photos\/(.+)$/);
        if (match) {
          await supabase.storage.from("profile-photos").remove([match[1]]);
        }
      } catch {
        // Non-critical — old file stays in storage
      }
    }

    return jsonOk({ cleared: true });
  } catch (err) {
    console.error("[profile/photo] DELETE error:", err);
    return jsonError("Internal server error", 500);
  }
}
