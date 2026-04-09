"use client";

import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { Settings } from "lucide-react";

export default function CrmSettingsPage() {
  return (
    <AdminPageGuard path="/admin/crm">
      <div className="flex flex-col items-center justify-center rounded-lg border border-stone-light/20 bg-white py-16">
        <Settings className="size-10 text-stone" />
        <h3 className="mt-3 font-heading text-lg font-semibold text-text-primary">
          CRM Settings
        </h3>
        <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
          Configure subscription topics, frequency caps, sending defaults, and
          suppression rules. Coming in&nbsp;Phase&nbsp;1.
        </p>
      </div>
    </AdminPageGuard>
  );
}
