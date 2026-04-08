/**
 * Admin panel access control.
 *
 * Maps admin sidebar items and dashboard sections to the platform staff
 * roles that are allowed to see them. super_admin sees everything.
 */

import type { PlatformRole } from "./constants";

// ─── Sidebar Visibility ────────────────────────────────────────────

/** Map of admin page path → which staff roles can access it */
export const ADMIN_PAGE_ACCESS: Record<string, PlatformRole[]> = {
  "/admin": [
    "super_admin",
    "ops_admin",
    "support_agent",
    "finance_admin",
    "compliance_admin",
    "readonly_internal",
  ],
  "/admin/moderation": [
    "super_admin",
    "ops_admin",
    "compliance_admin",
  ],
  "/admin/review-moderation": [
    "super_admin",
    "ops_admin",
    "compliance_admin",
  ],
  "/admin/users": [
    "super_admin",
    "ops_admin",
    "support_agent",
    "compliance_admin",
    "readonly_internal",
  ],
  "/admin/clubs": [
    "super_admin",
    "ops_admin",
    "readonly_internal",
  ],
  "/admin/guides": [
    "super_admin",
    "ops_admin",
    "compliance_admin",
    "readonly_internal",
  ],
  "/admin/financials": [
    "super_admin",
    "finance_admin",
  ],
  "/admin/team": [
    "super_admin",
  ],
  "/admin/platform-staff": [
    "super_admin",
  ],
  "/admin/support": [
    "super_admin",
    "ops_admin",
    "support_agent",
  ],
  "/admin/settings": [
    "super_admin",
  ],
  "/admin/audit-log": [
    "super_admin",
    "compliance_admin",
    "readonly_internal",
  ],
};

/**
 * Check if a staff role can access a given admin page.
 * super_admin always has access (belt-and-suspenders).
 */
export function canAccessAdminPage(
  staffRole: PlatformRole | null,
  path: string
): boolean {
  if (!staffRole) return false;
  if (staffRole === "super_admin") return true;
  const allowed = ADMIN_PAGE_ACCESS[path];
  if (!allowed) return false;
  return allowed.includes(staffRole);
}

// ─── Dashboard Stats Visibility ────────────────────────────────────

/** Stat card labels that are restricted to specific roles */
const FINANCIAL_STATS = new Set([
  "Platform Revenue",
  "GMV",
]);

const OPS_STATS = new Set([
  "Total Users",
  "Properties",
  "Bookings",
  "Clubs",
  "Total Leads",
  "Pending Review",
]);

/** Which stat cards a role can see on the admin dashboard */
export function canSeeStatCard(
  staffRole: PlatformRole,
  statLabel: string
): boolean {
  if (staffRole === "super_admin") return true;

  if (FINANCIAL_STATS.has(statLabel)) {
    return staffRole === "finance_admin";
  }

  if (OPS_STATS.has(statLabel)) {
    return [
      "ops_admin",
      "support_agent",
      "finance_admin",
      "compliance_admin",
      "readonly_internal",
    ].includes(staffRole);
  }

  return false;
}

/** Whether a role can see the "Users by Role" breakdown */
export function canSeeUserBreakdown(staffRole: PlatformRole): boolean {
  return [
    "super_admin",
    "ops_admin",
    "readonly_internal",
  ].includes(staffRole);
}

/** Whether a role can see the "Recent Bookings" section */
export function canSeeRecentBookings(staffRole: PlatformRole): boolean {
  return [
    "super_admin",
    "ops_admin",
    "support_agent",
    "finance_admin",
    "readonly_internal",
  ].includes(staffRole);
}

/** Whether a role can export reports */
export function canExportReports(staffRole: PlatformRole): boolean {
  return [
    "super_admin",
    "ops_admin",
    "finance_admin",
  ].includes(staffRole);
}
