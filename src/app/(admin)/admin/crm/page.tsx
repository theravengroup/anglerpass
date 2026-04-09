"use client";

import AdminPageGuard from "@/components/admin/AdminPageGuard";
import CrmDashboard from "@/components/admin/crm/CrmDashboard";

export default function CrmDashboardPage() {
  return (
    <AdminPageGuard path="/admin/crm">
      <CrmDashboard />
    </AdminPageGuard>
  );
}
