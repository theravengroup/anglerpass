import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  ShieldAlert,
  Users,
  ScrollText,
  UserPlus,
  Settings,
  Building2,
  Compass,
  DollarSign,
  Shield,
  LifeBuoy,
} from "lucide-react";
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
    label: "Review Moderation",
    href: "/admin/review-moderation",
    icon: <ShieldAlert />,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users />,
  },
  {
    label: "Clubs",
    href: "/admin/clubs",
    icon: <Building2 />,
  },
  {
    label: "Guides",
    href: "/admin/guides",
    icon: <Compass />,
  },
  {
    label: "Financials",
    href: "/admin/financials",
    icon: <DollarSign />,
  },
  {
    label: "Team",
    href: "/admin/team",
    icon: <UserPlus />,
  },
  {
    label: "Platform Staff",
    href: "/admin/platform-staff",
    icon: <Shield />,
  },
  {
    label: "Support Tickets",
    href: "/admin/support",
    icon: <LifeBuoy />,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings />,
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
  "/admin/review-moderation": "Review Moderation",
  "/admin/users": "User Management",
  "/admin/clubs": "Club Oversight",
  "/admin/financials": "Platform Financials",
  "/admin/team": "Team Management",
  "/admin/platform-staff": "Platform Staff Roles",
  "/admin/settings": "Platform Settings",
  "/admin/audit-log": "Audit Log",
  "/admin/support": "Support Tickets",
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
