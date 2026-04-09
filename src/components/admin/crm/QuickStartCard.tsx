"use client";

import Link from "next/link";
import { Plus, Layers, Users, FileText, ArrowRight } from "lucide-react";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: typeof Plus;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Create Campaign",
    description: "Send a broadcast, drip, or triggered email",
    href: "/admin/crm/campaigns",
    icon: Plus,
    color: "text-forest bg-forest/10",
  },
  {
    label: "Build Segment",
    description: "Define an audience with rules",
    href: "/admin/crm/segments",
    icon: Layers,
    color: "text-river bg-river/10",
  },
  {
    label: "View Contacts",
    description: "Browse users and their activity",
    href: "/admin/crm/contacts",
    icon: Users,
    color: "text-bronze bg-bronze/10",
  },
  {
    label: "Email Templates",
    description: "Reusable email designs",
    href: "/admin/crm/templates",
    icon: FileText,
    color: "text-charcoal bg-charcoal/10",
  },
];

interface QuickStartCardProps {
  isEmpty?: boolean;
}

export default function QuickStartCard({ isEmpty }: QuickStartCardProps) {
  return (
    <div className="rounded-lg border border-stone-light/20 bg-white p-5">
      {isEmpty && (
        <div className="mb-4">
          <h3 className="font-heading text-lg font-semibold text-text-primary">
            Get started with Marketing Automation
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Build campaigns, define audiences, and automate your outreach.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col gap-2 rounded-lg border border-stone-light/20 p-3 transition-all hover:border-stone-light/40 hover:shadow-sm"
            >
              <div className={`flex size-8 items-center justify-center rounded-md ${action.color}`}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-primary group-hover:text-forest">
                  {action.label}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-text-light">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="mt-auto size-3 text-stone opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
