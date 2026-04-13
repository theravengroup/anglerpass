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
  ShieldCheck,
  UserPlus,
  Gift,
  ClipboardList,
  SendHorizontal,
  Inbox,
  Sparkles,
  Building2,
  Link2,
  MousePointerClick,
  ShoppingBag,
  BarChart3,
  Megaphone,
  Wrench,
  HeartPulse,
  Activity,
  Blocks,
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
    label: "AnglerPass Compass",
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
    {
      label: "ClubOS",
      href: "/club/clubos",
      icon: <Blocks />,
    },
    {
      label: "Communications",
      href: "/club/clubos/communications",
      icon: <Megaphone />,
    },
    {
      label: "Operations",
      href: "/club/clubos/operations",
      icon: <Wrench />,
    },
    {
      label: "Membership Health",
      href: "/club/clubos/membership",
      icon: <HeartPulse />,
    },
    {
      label: "Property Activity",
      href: "/club/clubos/property",
      icon: <Activity />,
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
  corporate: [
    {
      label: "Staff",
      href: "/corporate/staff",
      icon: <Users />,
    },
    {
      label: "Billing",
      href: "/corporate/billing",
      icon: <DollarSign />,
    },
    {
      label: "Company Profile",
      href: "/corporate/profile",
      icon: <Building2 />,
    },
    {
      label: "Club Details",
      href: "/corporate/club",
      icon: <MapPin />,
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
  affiliate: [
    {
      label: "Overview",
      href: "/affiliate",
      icon: <BarChart3 />,
    },
    {
      label: "Brands",
      href: "/affiliate/brands",
      icon: <Link2 />,
    },
    {
      label: "Products",
      href: "/affiliate/products",
      icon: <ShoppingBag />,
    },
    {
      label: "Click Tracking",
      href: "/affiliate/clicks",
      icon: <MousePointerClick />,
    },
    {
      label: "Revenue",
      href: "/affiliate/revenue",
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
  "/club/clubos": "ClubOS",
  "/club/clubos/communications": "Communications",
  "/club/clubos/communications/new": "New Campaign",
  "/club/clubos/communications/templates": "Email Templates",
  "/club/clubos/communications/groups": "Member Groups",
  "/club/settings/email-preferences": "Email Preferences",
  "/club/clubos/operations": "Operations",
  "/club/clubos/membership": "Membership Health",
  "/club/clubos/property": "Property Activity",
  "/angler": "Your Fishing Dashboard",
  "/angler/bookings": "Bookings",
  "/angler/financials": "Spending & Fees",
  "/angler/discover": "Discover",
  "/angler/guides": "Find Guides",
  "/angler/delegates": "Trusted Delegates",
  "/angler/proposals": "Trip Proposals",
  "/corporate": "Corporate Dashboard",
  "/corporate/staff": "Staff Management",
  "/corporate/billing": "Billing & Invoices",
  "/corporate/profile": "Company Profile",
  "/corporate/club": "Club Details",
  "/guide": "Guide Dashboard",
  "/guide/profile": "Guide Profile",
  "/guide/availability": "Availability",
  "/guide/bookings": "Guide Bookings",
  "/guide/proposals": "Trip Proposals",
  "/guide/proposals/new": "New Trip Proposal",
  "/guide/reviews": "Reviews",
  "/guide/messages": "Messages",
  "/guide/earnings": "Earnings",
  "/affiliate": "Affiliate Dashboard",
  "/affiliate/brands": "Brand Partners",
  "/affiliate/products": "Product Catalog",
  "/affiliate/clicks": "Click Tracking",
  "/affiliate/revenue": "Revenue & Conversions",
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

  // Admin role has its own dedicated route group at /admin
  if (profile.role === "admin") {
    redirect("/admin");
  }

  const roleItems = ROLE_ITEMS[profile.role] ?? [];
  const sidebarItems: SidebarItem[] = [
    SHARED_ITEMS[0], // Dashboard
    SHARED_ITEMS[1], // Compass AI
    ...roleItems,
    ...SHARED_ITEMS.slice(2), // Notifications, Settings
  ];

  // Add Admin Panel link for users with admin role
  if (profile.roles.includes("admin") && profile.role !== "admin") {
    sidebarItems.push({
      label: "Admin Panel",
      href: "/admin",
      icon: <ShieldCheck />,
    });
  }

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
