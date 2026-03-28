"use client";

import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  MapPin,
  Inbox,
  Settings,
} from "lucide-react";
import DashboardShell from "@/components/shared/DashboardShell";
import { usePathname } from "next/navigation";

const adminSidebarItems = [
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
    label: "Properties",
    href: "/admin/properties",
    icon: <MapPin />,
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: <Inbox />,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings />,
  },
];

const pageTitles: Record<string, string> = {
  "/admin": "Admin Console",
  "/admin/moderation": "Moderation Queue",
  "/admin/users": "User Management",
  "/admin/properties": "Properties",
  "/admin/leads": "Leads",
  "/admin/settings": "Admin Settings",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const pageTitle =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([key]) =>
      pathname.startsWith(key)
    )?.[1] ||
    "Admin Console";

  return (
    <DashboardShell
      sidebarItems={adminSidebarItems}
      pageTitle={pageTitle}
      adminBadge
    >
      {children}
    </DashboardShell>
  );
}
