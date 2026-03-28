"use client";

import {
  LayoutDashboard,
  ShieldCheck,
  Users,
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
];

const pageTitles: Record<string, string> = {
  "/admin": "Admin Console",
  "/admin/moderation": "Moderation Queue",
  "/admin/users": "User Management",
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
