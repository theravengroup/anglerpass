"use client";

import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { FileText } from "lucide-react";

export default function CrmTemplatesPage() {
  return (
    <AdminPageGuard path="/admin/crm">
      <div className="flex flex-col items-center justify-center rounded-lg border border-stone-light/20 bg-white py-16">
        <FileText className="size-10 text-stone" />
        <h3 className="mt-3 font-heading text-lg font-semibold text-text-primary">
          Email Templates
        </h3>
        <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
          Reusable email designs and layouts. You can build emails directly
          inside each campaign step using the drag-and-drop&nbsp;builder.
        </p>
      </div>
    </AdminPageGuard>
  );
}
