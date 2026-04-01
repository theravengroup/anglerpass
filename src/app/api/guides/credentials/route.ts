import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CREDENTIAL_TYPES } from "@/lib/validations/guides";

// POST: Upload a credential document to Supabase Storage
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !CREDENTIAL_TYPES.includes(type as typeof CREDENTIAL_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid credential type. Must be one of: ${CREDENTIAL_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File must be a PDF, JPEG, PNG, or WebP" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify user has a guide profile
    const { data: guideProfile } = await (admin
      .from("guide_profiles" as never)
      .select("id")
      .eq("user_id" as never, user.id)
      .single()) as unknown as { data: { id: string } | null };

    if (!guideProfile) {
      return NextResponse.json(
        { error: "Guide profile not found. Create a profile first." },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get the URL (private bucket — use createSignedUrl for viewing)
    const { data: urlData } = await admin.storage
      .from("guide-credentials")
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    const url = urlData?.signedUrl ?? "";

    // Update the guide profile with the credential URL
    const urlField = `${type}_url`;
    await admin
      .from("guide_profiles" as never)
      .update({
        [urlField]: url,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, guideProfile.id);

    return NextResponse.json({ url, type, path }, { status: 201 });
  } catch (err) {
    console.error("[guides/credentials] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
