"use client";

import { useStaffRole } from "@/components/admin/StaffRoleProvider";
import { canAccessAdminPage } from "@/lib/permissions/admin-access";
import { PLATFORM_ROLE_LABELS } from "@/lib/permissions/constants";
import { ShieldAlert } from "lucide-react";

interface AdminPageGuardProps {
  path: string;
  children: React.ReactNode;
}

/**
 * Wraps an admin page and checks if the current staff role
 * has permission to view it. Shows an access-denied message if not.
 */
export default function AdminPageGuard({ path, children }: AdminPageGuardProps) {
  const staffRole = useStaffRole();

  if (!canAccessAdminPage(staffRole, path)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="size-6 text-red-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-text-primary">
          Access Restricted
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Your role ({PLATFORM_ROLE_LABELS[staffRole]}) does not have access to this page.
          Contact a Super Admin if you need elevated permissions.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
