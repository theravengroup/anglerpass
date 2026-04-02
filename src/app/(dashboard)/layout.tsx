import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Users,
  CalendarDays,
  Bell,
  Settings,
  Compass,
  FileText,
  Star,
  MessageSquare,
  DollarSign,
  UserCircle,
  Calendar,
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
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: <Bell />,
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
    {
      label: "Documents",
      href: "/landowner/documents",
      icon: <FileText />,
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
    {
      label: "Guide Approvals",
      href: "/club/guide-approvals",
      icon: <Compass />,
    },
    {
      label: "Settings",
      href: "/club/settings",
      icon: <Settings />,
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
    {
      label: "Find Guides",
      href: "/angler/guides",
      icon: <Users />,
    },
  ],
  guide: [
    {
      label: "My Profile",
      href: "/guide/profile",
      icon: <UserCircle />,
    },
    {
      label: "Availability",
      href: "/guide/availability",
      icon: <Calendar />,
    },
    {
      label: "Bookings",
      href: "/guide/bookings",
      icon: <CalendarDays />,
    },
    {
      label: "Reviews",
      href: "/guide/reviews",
      icon: <Star />,
    },
    {
      label: "Messages",
      href: "/guide/messages",
      icon: <MessageSquare />,
    },
    {
      label: "Earnings",
      href: "/guide/earnings",
      icon: <DollarSign />,
    },
  ],
};

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/landowner": "Property Management",
  "/landowner/properties": "Properties",
  "/landowner/properties/new": "Add Property",
  "/landowner/bookings": "Bookings",
  "/landowner/documents": "Documents",
  "/landowner/documents/new": "New Document",
  "/club": "Club Management",
  "/club/setup": "Set Up Your Club",
  "/club/members": "Members",
  "/club/properties": "Properties",
  "/club/settings": "Club Settings",
  "/club/guide-approvals": "Guide Approvals",
  "/angler": "Your Fishing Dashboard",
  "/angler/bookings": "Bookings",
  "/angler/discover": "Discover",
  "/angler/guides": "Find Guides",
  "/guide": "Guide Dashboard",
  "/guide/profile": "Guide Profile",
  "/guide/availability": "Availability",
  "/guide/bookings": "Guide Bookings",
  "/guide/reviews": "Reviews",
  "/guide/messages": "Messages",
  "/guide/earnings": "Earnings",
  "/dashboard/notifications": "Notifications",
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
