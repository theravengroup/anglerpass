"use client";

import {
  LayoutDashboard,
  MapPin,
  Users,
  CalendarDays,
  Mail,
  Settings,
} from "lucide-react";
import DashboardShell from "@/components/shared/DashboardShell";
import { usePathname } from "next/navigation";

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard />,
  },
  {
    label: "Properties",
    href: "/landowner/properties",
    icon: <MapPin />,
  },
  {
    label: "Members",
    href: "/club/members",
    icon: <Users />,
  },
  {
    label: "Bookings",
    href: "/angler/bookings",
    icon: <CalendarDays />,
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: <Mail />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings />,
  },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/landowner": "Property Management",
  "/landowner/properties": "Properties",
  "/club": "Club Management",
  "/club/members": "Members",
  "/angler": "Your Fishing Dashboard",
  "/angler/bookings": "Bookings",
  "/dashboard/messages": "Messages",
  "/dashboard/settings": "Settings",
};

export default function DashboardLayout({
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
    "Dashboard";

  return (
    <DashboardShell sidebarItems={sidebarItems} pageTitle={pageTitle}>
      {children}
    </DashboardShell>
  );
}
