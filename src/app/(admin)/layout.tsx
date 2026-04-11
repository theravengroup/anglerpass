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
  Landmark,
  Shield,
  LifeBuoy,
  Sparkles,
  CalendarDays,
  Mail,
  Link2,
} from "lucide-react";
import { StaffRoleProvider } from "@/components/admin/StaffRoleProvider";
import AdminShellFiltered from "@/components/admin/AdminShellFiltered";
import { getProfile } from "@/lib/auth/get-profile";
import { getPlatformStaffRole } from "@/lib/permissions/db";
import type { PlatformRole } from "@/lib/permissions/constants";
import type { SidebarItem } from "@/components/shared/DashboardSidebar";

const ALL_ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
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
    label: "Finance Ops",
    href: "/admin/finance-ops",
    icon: <Landmark />,
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
    label: "Bookings",
    href: "/admin/bookings",
    icon: <CalendarDays />,
  },
  {
    label: "CRM",
    href: "/admin/crm",
    icon: <Mail />,
  },
{
    label: "Compass AI",
    href: "/admin/compass",
    icon: <Sparkles />,
  },
  {
    label: "Affiliates",
    href: "/admin/affiliates",
    icon: <Link2 />,
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
  "/admin/finance-ops": "Finance Operations",
  "/admin/team": "Team Management",
  "/admin/platform-staff": "Platform Staff Roles",
  "/admin/settings": "Platform Settings",
  "/admin/audit-log": "Audit Log",
  "/admin/support": "Support Tickets",
  "/admin/bookings": "Booking Management",
  "/admin/crm": "Marketing Automation",
  "/admin/compass": "Compass AI Usage",
  "/admin/affiliates": "Affiliate Program",
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

  // Fetch platform staff role for permission filtering
  const staffRecord = await getPlatformStaffRole(profile.id);
  const staffRole: PlatformRole = (staffRecord?.role as PlatformRole) ?? "readonly_internal";

  return (
    <StaffRoleProvider role={staffRole}>
      <AdminShellFiltered
        allItems={ALL_ADMIN_SIDEBAR_ITEMS}
        pageTitles={PAGE_TITLES}
        user={profile}
      >
        {children}
      </AdminShellFiltered>
    </StaffRoleProvider>
  );
}
