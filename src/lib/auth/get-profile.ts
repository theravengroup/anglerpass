import { createClient } from "@/lib/supabase/server";

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

  if (!profile) return null;

  return {
    id: profile.id,
    display_name: profile.display_name,
    role: profile.role,
    email: user.email ?? null,
  };
}
