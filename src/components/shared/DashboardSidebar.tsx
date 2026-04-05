"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
} from "lucide-react";
 
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/auth/get-profile";
import { useUnreadCount } from "@/hooks/use-unread-count";

const ROLE_LABELS: Record<string, string> = {
  landowner: "Landowner",
  club_admin: "Club Admin",
  angler: "Angler",
  admin: "Admin",
};

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  open: boolean;
  onToggle: () => void;
  adminBadge?: boolean;
  user: UserProfile | null;
}

export default function DashboardSidebar({
  items,
  open,
  onToggle,
  adminBadge = false,
  user,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { count: unreadCount } = useUnreadCount();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-forest-deep text-white transition-[width,transform] duration-200",
          collapsed ? "w-[68px]" : "w-64",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:relative"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
          <img src="/images/anglerpass-noword-logo.svg" alt="" className="h-7 w-auto opacity-80" />
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight">
                AnglerPass
              </span>
              {adminBadge && (
                <span className="rounded bg-bronze/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bronze-light">
                  Admin
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation — flex-1 + min-h-0 ensures it fills remaining space and scrolls */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/admin" &&
                pathname.startsWith(item.href));

            // Inject unread count for notifications
            const badge =
              item.href === "/dashboard/notifications" && unreadCount > 0
                ? String(unreadCount)
                : item.badge;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-bronze/20 text-bronze-light"
                    : "text-white/70 hover:bg-white/8 hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className="relative shrink-0 [&>svg]:size-[18px]">
                  {item.icon}
                  {collapsed && badge && (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-bronze text-[9px] font-bold text-white">
                      {parseInt(badge) > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && badge && (
                  <span className="ml-auto rounded-full bg-bronze/20 px-2 py-0.5 text-[11px] font-medium text-bronze-light">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom pinned sections */}
        <div className="mt-auto shrink-0">
          {/* Collapse toggle (desktop only) */}
          <div className="hidden border-t border-white/10 px-3 py-2 lg:block">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/8 hover:text-white/80 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="size-[18px] shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="size-[18px] shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>

          {/* User section */}
          <div className="border-t border-white/10 px-3 py-3">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                <User className="size-3.5" />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">
                    {user?.display_name || user?.email || "Account"}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {user?.role ? ROLE_LABELS[user.role] || user.role : "Manage settings"}
                  </p>
                </div>
              )}
              {!collapsed && (
                <Settings className="size-4 shrink-0 text-white/40" />
              )}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
