import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Users,
  CalendarDays,
  Mail,
  Settings,
  Compass,
} from "lucide-react";
import DashboardShell from "@/components/shared/DashboardShell";
import { getProfile } from "@/lib/auth/get-profile";
import type { SidebarItem } from "@/components/shared/DashboardSidebar";

const SHARED_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard />,
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

const ROLE_ITEMS: Record<string, SidebarItem[]> = {
  landowner: [
    {
      label: "Properties",
      href: "/landowner/properties",
      icon: <MapPin />,
    },
    {
      label: "Bookings",
      href: "/landowner/bookings",
      icon: <CalendarDays />,
    },
  ],
  club_admin: [
    {
      label: "Members",
      href: "/club/members",
      icon: <Users />,
    },
    {
      label: "Properties",
      href: "/club/properties",
      icon: <MapPin />,
    },
  ],
  angler: [
    {
      label: "Bookings",
      href: "/angler/bookings",
      icon: <CalendarDays />,
    },
    {
      label: "Discover",
      href: "/angler/discover",
      icon: <Compass />,
    },
  ],
};

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/landowner": "Property Management",
  "/landowner/properties": "Properties",
  "/landowner/bookings": "Bookings",
  "/club": "Club Management",
  "/club/members": "Members",
  "/club/properties": "Properties",
  "/angler": "Your Fishing Dashboard",
  "/angler/bookings": "Bookings",
  "/angler/discover": "Discover",
  "/dashboard/messages": "Messages",
  "/dashboard/settings": "Settings",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const roleItems = ROLE_ITEMS[profile.role] ?? [];
  const sidebarItems: SidebarItem[] = [
    SHARED_ITEMS[0], // Dashboard
    ...roleItems,
    ...SHARED_ITEMS.slice(1), // Messages, Settings
  ];

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      pageTitles={PAGE_TITLES}
      user={profile}
    >
      {children}
    </DashboardShell>
  );
}
