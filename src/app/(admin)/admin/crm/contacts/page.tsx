"use client";

import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { Users } from "lucide-react";

export default function CrmContactsPage() {
  return (
    <AdminPageGuard path="/admin/crm">
      <div className="flex flex-col items-center justify-center rounded-lg border border-stone-light/20 bg-white py-16">
        <Users className="size-10 text-stone" />
        <h3 className="mt-3 font-heading text-lg font-semibold text-text-primary">
          Contact Browser
        </h3>
        <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
          Browse users, view engagement history, and manage email preferences.
          Coming in&nbsp;Phase&nbsp;5.
        </p>
      </div>
    </AdminPageGuard>
  );
}
