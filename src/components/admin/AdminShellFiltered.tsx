"use client";

import DashboardShell from "@/components/shared/DashboardShell";
import { useStaffRole } from "@/components/admin/StaffRoleProvider";
import { canAccessAdminPage } from "@/lib/permissions/admin-access";
import type { SidebarItem } from "@/components/shared/DashboardSidebar";
import type { UserProfile } from "@/lib/auth/get-profile";

interface AdminShellFilteredProps {
  allItems: SidebarItem[];
  pageTitles: Record<string, string>;
  user: UserProfile;
  children: React.ReactNode;
}

/**
 * Client wrapper that filters admin sidebar items based on the
 * current user's platform staff role (from context).
 */
export default function AdminShellFiltered({
  allItems,
  pageTitles,
  user,
  children,
}: AdminShellFilteredProps) {
  const staffRole = useStaffRole();

  const sidebarItems = allItems.filter((item) =>
    canAccessAdminPage(staffRole, item.href)
  );

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      pageTitles={pageTitles}
      defaultTitle="Admin Console"
      adminBadge
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
