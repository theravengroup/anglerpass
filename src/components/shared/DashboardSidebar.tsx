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
/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

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
}

export default function DashboardSidebar({
  items,
  open,
  onToggle,
  adminBadge = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-forest-deep text-white transition-all duration-200",
          collapsed ? "w-[68px]" : "w-64",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-white/10">
          <img src="/images/anglerpass-noword-logo.svg" alt="" style={{ height: 28, width: 'auto', opacity: 0.8 }} />
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/admin" &&
                pathname.startsWith(item.href));

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
                <span className="shrink-0 [&>svg]:size-[18px]">
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-bronze/20 px-2 py-0.5 text-[11px] font-medium text-bronze-light">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block border-t border-white/10 px-3 py-2">
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
                  Account
                </p>
                <p className="truncate text-xs text-white/50">
                  Manage settings
                </p>
              </div>
            )}
            {!collapsed && (
              <Settings className="size-4 shrink-0 text-white/40" />
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
