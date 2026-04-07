import { redirect } from "next/navigation";
import ImpersonationWrapper from "@/components/shared/ImpersonationWrapper";
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
  Shield,
  UserPlus,
  Gift,
  ClipboardList,
  SendHorizontal,
  Inbox,
  Sparkles,
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
    label: "Compass AI",
    href: "/compass",
    icon: <Sparkles />,
    badge: "AI",
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
      label: "Financials",
      href: "/landowner/financials",
      icon: <DollarSign />,
    },
    {
      label: "Documents",
      href: "/landowner/documents",
      icon: <FileText />,
    },
  ],
  club_admin: [
    {
      label: "Applications",
      href: "/club/applications",
      icon: <ClipboardList />,
    },
    {
      label: "Members",
      href: "/club/members",
      icon: <Users />,
    },
    {
      label: "Staff",
      href: "/club/staff",
      icon: <Shield />,
    },
    {
      label: "Book for Member",
      href: "/club/book-for-member",
      icon: <UserPlus />,
    },
    {
      label: "Properties",
      href: "/club/properties",
      icon: <MapPin />,
    },
    {
      label: "Financials",
      href: "/club/financials",
      icon: <DollarSign />,
    },
    {
      label: "Guide Approvals",
      href: "/club/guide-approvals",
      icon: <Compass />,
    },
    {
      label: "Referrals",
      href: "/club/referrals",
      icon: <Gift />,
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
      label: "Spending",
      href: "/angler/financials",
      icon: <DollarSign />,
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
    {
      label: "Proposals",
      href: "/angler/proposals",
      icon: <Inbox />,
    },
    {
      label: "Delegates",
      href: "/angler/delegates",
      icon: <Shield />,
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
      label: "Trip Proposals",
      href: "/guide/proposals",
      icon: <SendHorizontal />,
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
  "/landowner/financials": "Financials",
  "/landowner/documents": "Documents",
  "/landowner/documents/new": "New Document",
  "/club": "Club Management",
  "/club/setup": "Set Up Your Club",
  "/club/applications": "Membership Applications",
  "/club/members": "Members",
  "/club/properties": "Properties",
  "/club/financials": "Club Financials",
  "/club/settings": "Club Settings",
  "/club/guide-approvals": "Guide Approvals",
  "/club/staff": "Staff Management",
  "/club/referrals": "Member Referrals",
  "/club/book-for-member": "Book for Member",
  "/angler": "Your Fishing Dashboard",
  "/angler/bookings": "Bookings",
  "/angler/financials": "Spending & Fees",
  "/angler/discover": "Discover",
  "/angler/guides": "Find Guides",
  "/angler/delegates": "Trusted Delegates",
  "/angler/proposals": "Trip Proposals",
  "/guide": "Guide Dashboard",
  "/guide/profile": "Guide Profile",
  "/guide/availability": "Availability",
  "/guide/bookings": "Guide Bookings",
  "/guide/proposals": "Trip Proposals",
  "/guide/proposals/new": "New Trip Proposal",
  "/guide/reviews": "Reviews",
  "/guide/messages": "Messages",
  "/guide/earnings": "Earnings",
  "/dashboard/notifications": "Notifications",
  "/dashboard/settings": "Settings",
  "/compass": "AnglerPass Compass",
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
    SHARED_ITEMS[1], // Compass AI
    ...roleItems,
    ...SHARED_ITEMS.slice(2), // Notifications, Settings
  ];

  return (
    <ImpersonationWrapper>
      <DashboardShell
        sidebarItems={sidebarItems}
        pageTitles={PAGE_TITLES}
        user={profile}
      >
        {children}
      </DashboardShell>
    </ImpersonationWrapper>
  );
}
