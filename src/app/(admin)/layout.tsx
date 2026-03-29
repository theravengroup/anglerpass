import { redirect } from "next/navigation";
import { LayoutDashboard, ShieldCheck, Users, ScrollText } from "lucide-react";
import DashboardShell from "@/components/shared/DashboardShell";
import { getProfile } from "@/lib/auth/get-profile";
import type { SidebarItem } from "@/components/shared/DashboardSidebar";

const ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Admin Home",
    href: "/admin",
    icon: <LayoutDashboard />,
  },
  {
    label: "Moderation Queue",
    href: "/admin/moderation",
    icon: <ShieldCheck />,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users />,
  },
  {
    label: "Audit Log",
    href: "/admin/audit-log",
    icon: <ScrollText />,
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Admin Console",
  "/admin/moderation": "Moderation Queue",
  "/admin/users": "User Management",
  "/admin/audit-log": "Audit Log",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  // Defense-in-depth: middleware already checks for admin role
  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell
      sidebarItems={ADMIN_SIDEBAR_ITEMS}
      pageTitles={PAGE_TITLES}
      defaultTitle="Admin Console"
      adminBadge
      user={profile}
    >
      {children}
    </DashboardShell>
  );
}
