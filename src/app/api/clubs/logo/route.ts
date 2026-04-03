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
    const clubId = formData.get("clubId") as string | null;

    if (!file || !clubId) {
      return jsonError("File and clubId are required", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File is too large. Maximum size is 5MB.", 413);
    }

    if (file.type !== "image/webp") {
      return jsonError("Only WebP images are accepted (client should convert first).", 400);
    }

    const admin = createAdminClient();

    // Verify club ownership
    const { data: club } = await admin
      .from("clubs")
      .select("id, owner_id")
      .eq("id", clubId)
      .single();

    if (!club || club.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Upload to Supabase Storage
    const fileName = `${clubId}/logo-${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("club-logos")
      .upload(fileName, file, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      console.error("[clubs/logo] Upload error:", uploadError);
      return jsonError("Failed to upload logo", 500);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("club-logos").getPublicUrl(fileName);

    // Update logo_url on the clubs table
    await admin
      .from("clubs")
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", clubId);

    return jsonOk({ url: publicUrl });
  } catch (err) {
    console.error("[clubs/logo] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);
    const { user, supabase } = auth;

    const body = await request.json();
    const clubId = body.clubId as string | undefined;

    if (!clubId) {
      return jsonError("clubId is required", 400);
    }

    const admin = createAdminClient();

    // Verify club ownership
    const { data: club } = await admin
      .from("clubs")
      .select("id, owner_id, logo_url")
      .eq("id", clubId)
      .single();

    if (!club || club.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Clear logo_url
    await admin
      .from("clubs")
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq("id", clubId);

    // Try to delete from storage (non-blocking)
    if (club.logo_url) {
      try {
        const match = club.logo_url.match(/club-logos\/(.+)$/);
        if (match) {
          await supabase.storage.from("club-logos").remove([match[1]]);
        }
      } catch {
        // Non-critical
      }
    }

    return jsonOk({ cleared: true });
  } catch (err) {
    console.error("[clubs/logo] DELETE error:", err);
    return jsonError("Internal server error", 500);
  }
}
