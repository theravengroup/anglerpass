"use client";

import { useState } from "react";
import DashboardSidebar, {
  type SidebarItem,
} from "@/components/shared/DashboardSidebar";
import DashboardTopbar from "@/components/shared/DashboardTopbar";

interface DashboardShellProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  pageTitle: string;
  adminBadge?: boolean;
}

export default function DashboardShell({
  children,
  sidebarItems,
  pageTitle,
  adminBadge = false,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-offwhite">
      <DashboardSidebar
        items={sidebarItems}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
        adminBadge={adminBadge}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          pageTitle={pageTitle}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
