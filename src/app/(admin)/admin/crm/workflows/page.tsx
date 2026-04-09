"use client";

import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { GitBranch } from "lucide-react";

export default function CrmWorkflowsPage() {
  return (
    <AdminPageGuard path="/admin/crm">
      <div className="flex flex-col items-center justify-center rounded-lg border border-stone-light/20 bg-white py-16">
        <GitBranch className="size-10 text-stone" />
        <h3 className="mt-3 font-heading text-lg font-semibold text-text-primary">
          Visual Workflows
        </h3>
        <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
          Build branching automation flows with if/else logic, delays, and
          multi-step sequences. Coming in&nbsp;Phase&nbsp;3.
        </p>
      </div>
    </AdminPageGuard>
  );
}
