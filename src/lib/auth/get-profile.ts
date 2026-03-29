import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserProfile = {
  id: string;
  display_name: string | null;
  role: string;
  email: string | null;
};

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", user.id)
    .returns<{ id: string; display_name: string | null; role: string }[]>()
    .single();

  if (profile) {
    return {
      id: profile.id,
      display_name: profile.display_name,
      role: profile.role,
      email: user.email ?? null,
    };
  }

  // Self-heal: profile row is missing (trigger may have failed).
  // Create a default profile so the user isn't stuck in a redirect loop.
  console.warn(
    `[get-profile] No profile found for user ${user.id} — creating default`
  );

  const defaultRole =
    (user.user_metadata?.role as string) || "angler";
  const displayName =
    (user.user_metadata?.display_name as string) ??
    (user.user_metadata?.first_name as string) ??
    null;

  const admin = createAdminClient();
  const { data: created, error: insertError } = await admin
    .from("profiles")
    .upsert(
      { id: user.id, display_name: displayName, role: defaultRole },
      { onConflict: "id" }
    )
    .select("id, display_name, role")
    .single();

  if (insertError || !created) {
    console.error("[get-profile] Failed to create profile:", insertError);
    return null;
  }

  return {
    id: created.id,
    display_name: created.display_name,
    role: created.role,
    email: user.email ?? null,
  };
}
