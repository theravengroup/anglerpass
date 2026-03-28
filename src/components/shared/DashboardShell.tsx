"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar, {
  type SidebarItem,
} from "@/components/shared/DashboardSidebar";
import DashboardTopbar from "@/components/shared/DashboardTopbar";
import type { UserProfile } from "@/lib/auth/get-profile";

interface DashboardShellProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  pageTitles: Record<string, string>;
  defaultTitle?: string;
  adminBadge?: boolean;
  user: UserProfile | null;
}

export default function DashboardShell({
  children,
  sidebarItems,
  pageTitles,
  defaultTitle = "Dashboard",
  adminBadge = false,
  user,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const pageTitle =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([key]) =>
      pathname.startsWith(key)
    )?.[1] ||
    defaultTitle;

  return (
    <div className="flex h-screen bg-offwhite">
      <DashboardSidebar
        items={sidebarItems}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        adminBadge={adminBadge}
        user={user}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          pageTitle={pageTitle}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
