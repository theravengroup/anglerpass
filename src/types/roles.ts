export type UserRole = "landowner" | "club_admin" | "angler" | "admin" | "guide" | "corporate" | "affiliate";

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  landowner: "/landowner",
  club_admin: "/club",
  angler: "/angler",
  admin: "/admin",
  guide: "/guide",
  corporate: "/corporate",
  affiliate: "/affiliate",
};

export function getRoleHomePath(role: string): string {
  if (role in ROLE_HOME_PATHS) {
    return ROLE_HOME_PATHS[role as UserRole];
  }
  return "/dashboard";
}
