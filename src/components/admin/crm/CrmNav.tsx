"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Mail,
  Users,
  GitBranch,
  Layers,
  FileText,
  Settings,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const CRM_NAV_ITEMS: NavItem[] = [
  { href: "/admin/crm", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/crm/campaigns", label: "Campaigns", icon: Mail },
  { href: "/admin/crm/workflows", label: "Workflows", icon: GitBranch },
  { href: "/admin/crm/segments", label: "Segments", icon: Layers },
  { href: "/admin/crm/contacts", label: "Contacts", icon: Users },
  { href: "/admin/crm/templates", label: "Templates", icon: FileText },
  { href: "/admin/crm/settings", label: "Settings", icon: Settings },
];

export default function CrmNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-stone-light/20 px-1">
      {CRM_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-forest text-forest"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
