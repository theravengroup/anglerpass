/**
 * Centralized permission constants for the AnglerPass permissions system.
 *
 * These string IDs match the `permissions.id` column in the database.
 * Import from here — never hardcode permission strings in components or routes.
 */

// ─── Permission IDs ─────────────────────────────────────────────────

export const P = {
  // Booking
  BOOKING_VIEW_OWN: "booking.view_own",
  BOOKING_VIEW_CLUB: "booking.view_club",
  BOOKING_VIEW_ALL: "booking.view_all",
  BOOKING_CREATE: "booking.create",
  BOOKING_CREATE_ON_BEHALF: "booking.create_on_behalf",
  BOOKING_MODIFY: "booking.modify",
  BOOKING_CANCEL: "booking.cancel",
  BOOKING_OVERRIDE_LIMITS: "booking.override_limits",
  BOOKING_OVERRIDE_BLACKOUTS: "booking.override_blackouts",
  BOOKING_WAIVE_FEES: "booking.waive_fees",
  BOOKING_RESEND_CONFIRMATION: "booking.resend_confirmation",

  // Profile
  PROFILE_VIEW_OWN: "profile.view_own",
  PROFILE_EDIT_OWN: "profile.edit_own",
  PROFILE_VIEW_MEMBERS: "profile.view_members",
  PROFILE_EDIT_MEMBERS: "profile.edit_members",
  PROFILE_VIEW_ALL: "profile.view_all",
  PROFILE_EDIT_ALL: "profile.edit_all",
  PROFILE_SUSPEND: "profile.suspend",
  PROFILE_CHANGE_ROLE: "profile.change_role",

  // Delegate
  DELEGATE_VIEW: "delegate.view",
  DELEGATE_MANAGE: "delegate.manage",
  DELEGATE_VIEW_PRINCIPAL_BOOKINGS: "delegate.view_principal_bookings",
  DELEGATE_CREATE_BOOKING_FOR_PRINCIPAL: "delegate.create_booking_for_principal",

  // Club
  CLUB_EDIT_SETTINGS: "club.edit_settings",
  CLUB_MANAGE_STAFF: "club.manage_staff",
  CLUB_MANAGE_MEMBERS: "club.manage_members",
  CLUB_MANAGE_PLANS: "club.manage_plans",
  CLUB_MANAGE_PROPERTIES: "club.manage_properties",
  CLUB_MANAGE_ACCESS_INSTRUCTIONS: "club.manage_access_instructions",
  CLUB_VIEW_ROSTER: "club.view_roster",

  // Financial
  FINANCIAL_VIEW_CLUB_CHARGES: "financial.view_club_charges",
  FINANCIAL_VIEW_ALL_CHARGES: "financial.view_all_charges",
  FINANCIAL_ISSUE_REFUND: "financial.issue_refund",
  FINANCIAL_ADJUST_FEES: "financial.adjust_fees",
  FINANCIAL_EXPORT_REPORTS: "financial.export_reports",
  FINANCIAL_MANAGE_PAYOUTS: "financial.manage_payouts",

  // Messaging
  MESSAGING_VIEW_TRIP: "messaging.view_trip",
  MESSAGING_SEND_TRIP: "messaging.send_trip",
  MESSAGING_SEND_BULK: "messaging.send_bulk",
  MESSAGING_INCLUDE_DELEGATES: "messaging.include_delegates",

  // Compliance
  COMPLIANCE_VIEW_DOCS: "compliance.view_docs",
  COMPLIANCE_APPROVE_DOCS: "compliance.approve_docs",
  COMPLIANCE_SUSPEND_USER: "compliance.suspend_user",
  COMPLIANCE_SUSPEND_LISTING: "compliance.suspend_listing",

  // System
  SYSTEM_IMPERSONATE: "system.impersonate",
  SYSTEM_UNLOCK_ACCOUNT: "system.unlock_account",
  SYSTEM_VIEW_AUDIT_LOGS: "system.view_audit_logs",
  SYSTEM_MODIFY_CONFIG: "system.modify_config",
} as const;

export type PermissionId = (typeof P)[keyof typeof P];

// ─── Scope Types ────────────────────────────────────────────────────

export type ScopeType = "platform" | "organization" | "consumer";

// ─── Platform Staff Roles ───────────────────────────────────────────

export const PLATFORM_ROLES = [
  "super_admin",
  "ops_admin",
  "support_agent",
  "finance_admin",
  "compliance_admin",
  "readonly_internal",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  super_admin: "Super Admin",
  ops_admin: "Operations Admin",
  support_agent: "Support Agent",
  finance_admin: "Finance Admin",
  compliance_admin: "Compliance Admin",
  readonly_internal: "Read-Only Internal",
};

export const PLATFORM_ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  super_admin: "Full platform access. Can modify config, impersonate, manage all roles.",
  ops_admin: "User/content management. Can suspend users, moderate, export reports.",
  support_agent: "Customer support. Can view accounts, create/modify bookings, unlock.",
  finance_admin: "Financial operations. Can issue refunds, adjust fees, manage payouts.",
  compliance_admin: "Verification and compliance. Can approve docs, suspend users/listings.",
  readonly_internal: "Read-only access to all platform data for internal visibility.",
};

// ─── Club Roles ─────────────────────────────────────────────────────

export const CLUB_ROLES = [
  "owner",
  "admin",
  "club_admin",
  "booking_staff",
  "ops_staff",
  "staff",
  "finance_staff",
  "readonly_staff",
  "member",
] as const;

export type ClubRole = (typeof CLUB_ROLES)[number];

export const CLUB_ROLE_LABELS: Record<ClubRole, string> = {
  owner: "Owner",
  admin: "Owner",           // legacy alias
  club_admin: "Club Admin",
  booking_staff: "Booking Staff",
  ops_staff: "Operations Staff",
  staff: "Operations Staff", // legacy alias
  finance_staff: "Finance Staff",
  readonly_staff: "Read-Only Staff",
  member: "Member",
};

export const CLUB_ROLE_DESCRIPTIONS: Record<ClubRole, string> = {
  owner: "Full club control. Manage staff, members, properties, settings, and finances.",
  admin: "Full club control. Manage staff, members, properties, settings, and finances.",
  club_admin: "Day-to-day management. Members, properties, settings, finances, and bookings.",
  booking_staff: "Booking operations. View, create, modify, and cancel bookings for members.",
  ops_staff: "Member operations. Manage members, view profiles, and send messages.",
  staff: "Member operations. Manage members, view profiles, and send messages.",
  finance_staff: "Financial visibility. View club charges, member profiles, and roster.",
  readonly_staff: "View-only access. See bookings, member profiles, and roster.",
  member: "Standard member. Book trips, view own bookings, manage personal profile.",
};

export const CLUB_ROLE_PERMISSION_SUMMARIES: Record<ClubRole, { category: string; abilities: string[] }[]> = {
  owner: [
    { category: "Bookings", abilities: ["View all club bookings", "Create bookings on behalf of members", "Modify and cancel bookings", "Override limits and blackouts", "Waive fees"] },
    { category: "Members", abilities: ["View and edit member profiles", "Manage staff roles", "View full roster"] },
    { category: "Club", abilities: ["Edit club settings", "Manage properties and access instructions", "Manage membership plans"] },
    { category: "Financial", abilities: ["View club charges"] },
    { category: "Messaging", abilities: ["Send bulk notifications", "Include delegates in threads"] },
  ],
  admin: [
    { category: "Bookings", abilities: ["View all club bookings", "Create bookings on behalf of members", "Modify and cancel bookings", "Override limits and blackouts", "Waive fees"] },
    { category: "Members", abilities: ["View and edit member profiles", "Manage staff roles", "View full roster"] },
    { category: "Club", abilities: ["Edit club settings", "Manage properties and access instructions", "Manage membership plans"] },
    { category: "Financial", abilities: ["View club charges"] },
    { category: "Messaging", abilities: ["Send bulk notifications", "Include delegates in threads"] },
  ],
  club_admin: [
    { category: "Bookings", abilities: ["View all club bookings", "Create bookings on behalf of members", "Modify and cancel bookings", "Resend confirmations"] },
    { category: "Members", abilities: ["View and edit member profiles", "View full roster"] },
    { category: "Club", abilities: ["Edit club settings", "Manage properties and access instructions", "Manage membership plans"] },
    { category: "Financial", abilities: ["View club charges"] },
    { category: "Messaging", abilities: ["Send bulk notifications", "Include delegates in threads"] },
  ],
  booking_staff: [
    { category: "Bookings", abilities: ["View all club bookings", "Create bookings on behalf of members", "Modify and cancel bookings", "Resend confirmations"] },
    { category: "Members", abilities: ["View member profiles", "View full roster"] },
  ],
  ops_staff: [
    { category: "Members", abilities: ["View and edit member profiles", "Manage members", "View full roster"] },
    { category: "Messaging", abilities: ["Send bulk notifications"] },
  ],
  staff: [
    { category: "Members", abilities: ["View and edit member profiles", "Manage members", "View full roster"] },
    { category: "Messaging", abilities: ["Send bulk notifications"] },
  ],
  finance_staff: [
    { category: "Financial", abilities: ["View club charges"] },
    { category: "Members", abilities: ["View member profiles", "View full roster"] },
  ],
  readonly_staff: [
    { category: "Bookings", abilities: ["View all club bookings"] },
    { category: "Members", abilities: ["View member profiles", "View full roster"] },
  ],
  member: [
    { category: "Bookings", abilities: ["Book trips", "View own bookings"] },
    { category: "Profile", abilities: ["Edit own profile"] },
  ],
};

/** Numeric hierarchy for role ordering and validation */
export const CLUB_ROLE_HIERARCHY: Record<ClubRole, number> = {
  owner: 100,
  admin: 100,
  club_admin: 80,
  booking_staff: 40,
  ops_staff: 40,
  staff: 40,
  finance_staff: 40,
  readonly_staff: 20,
  member: 0,
};

export const CLUB_STAFF_ROLES: ClubRole[] = [
  "owner",
  "admin",
  "club_admin",
  "booking_staff",
  "ops_staff",
  "staff",
  "finance_staff",
  "readonly_staff",
];

/** Roles that can be assigned by a club owner to staff */
export const ASSIGNABLE_CLUB_ROLES: ClubRole[] = [
  "club_admin",
  "booking_staff",
  "ops_staff",
  "finance_staff",
  "readonly_staff",
];

// ─── Delegate Access Levels ─────────────────────────────────────────

export const DELEGATE_LEVELS = ["viewer", "booking_manager"] as const;

export type DelegateLevel = (typeof DELEGATE_LEVELS)[number];

export const DELEGATE_LEVEL_LABELS: Record<DelegateLevel, string> = {
  viewer: "Viewer",
  booking_manager: "Booking Manager",
};

export const DELEGATE_LEVEL_DESCRIPTIONS: Record<DelegateLevel, string> = {
  viewer: "Can view your bookings and trip details. Cannot make changes.",
  booking_manager: "Can view, create, modify, and cancel bookings on your behalf.",
};

export const DELEGATE_PERMISSION_SUMMARIES: Record<DelegateLevel, string[]> = {
  viewer: [
    "View your bookings and trip details",
    "View trip messages",
    "See upcoming and past reservations",
  ],
  booking_manager: [
    "Everything a Viewer can do, plus:",
    "Create bookings on your behalf",
    "Modify existing bookings",
    "Cancel bookings",
  ],
};
