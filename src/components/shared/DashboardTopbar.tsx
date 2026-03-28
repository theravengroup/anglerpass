"use client";

import { Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardTopbarProps {
  pageTitle: string;
  onMenuToggle: () => void;
}

export default function DashboardTopbar({
  pageTitle,
  onMenuToggle,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-stone-light/20 bg-offwhite px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden text-text-secondary hover:text-text-primary"
        onClick={onMenuToggle}
      >
        <Menu className="size-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page title */}
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
        {pageTitle}
      </h1>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-text-secondary hover:text-text-primary"
        >
          <Bell className="size-[18px]" />
          <span className="sr-only">Notifications</span>
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-bronze" />
        </Button>

        <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-forest/10 text-forest">
          <User className="size-4" />
        </div>
      </div>
    </header>
  );
}
