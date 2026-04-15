import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  UserMinus,
  FileEdit,
  ShieldAlert,
  Send,
  Eye,
  Flag,
  EyeOff,
  Trash2,
} from "lucide-react";

// ─── Booking / Property Status ──────────────────────────────────────

export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const BOOKING_STATUS: Record<string, StatusConfig> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-river",
    bg: "bg-river/10",
  },
} as const;

/** Flat color map for compact badges (no icon needed) */
export const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: "text-bronze bg-bronze/10",
  confirmed: "text-forest bg-forest/10",
  declined: "text-red-500 bg-red-50",
  cancelled: "text-text-light bg-stone-light/10",
  completed: "text-river bg-river/10",
};

// ─── Club Campaign Status ──────────────────────────────────────────

export const CLUB_CAMPAIGN_STATUS: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "text-text-light",
    bg: "bg-offwhite",
  },
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  sending: {
    label: "Sending",
    icon: Send,
    color: "text-river",
    bg: "bg-river/10",
  },
  sent: {
    label: "Sent",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  partially_sent: {
    label: "Partially Sent",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
};

// ─── Club Event Status ────────────────────────────────────────────

export const CLUB_EVENT_STATUS: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "text-text-light",
    bg: "bg-offwhite",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-river",
    bg: "bg-river/10",
  },
};

// ─── Event Registration Status ────────────────────────────────────

export const EVENT_REGISTRATION_STATUS: Record<string, StatusConfig> = {
  registered: {
    label: "Registered",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  waitlisted: {
    label: "Waitlisted",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
  attended: {
    label: "Attended",
    icon: CheckCircle2,
    color: "text-river",
    bg: "bg-river/10",
  },
  no_show: {
    label: "No Show",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
};

// ─── Incident Status ──────────────────────────────────────────────

export const INCIDENT_STATUS: Record<string, StatusConfig> = {
  open: {
    label: "Open",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  investigating: {
    label: "Investigating",
    icon: Eye,
    color: "text-river",
    bg: "bg-river/10",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  closed: {
    label: "Closed",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
};

// ─── Incident Severity ────────────────────────────────────────────

export const INCIDENT_SEVERITY: Record<string, StatusConfig> = {
  low: {
    label: "Low",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  medium: {
    label: "Medium",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  high: {
    label: "High",
    icon: ShieldAlert,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  critical: {
    label: "Critical",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

// ─── Membership Status ──────────────────────────────────────────────

export const MEMBERSHIP_STATUS: Record<string, StatusConfig> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  inactive: {
    label: "Inactive",
    icon: UserMinus,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  removed: {
    label: "Removed",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
};

// ─── Guide Profile Status ──────────────────────────────────────────

export const GUIDE_STATUS: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "text-text-light",
    bg: "bg-offwhite",
  },
  pending: {
    label: "Pending Verification",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    color: "text-river",
    bg: "bg-river/10",
  },
  live: {
    label: "Live",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  suspended: {
    label: "Suspended",
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

// ─── Property Status ───────────────────────────────────────────────

export const PROPERTY_STATUS: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "text-text-light",
    bg: "bg-offwhite",
  },
  pending_review: {
    label: "Pending Review",
    icon: Clock,
    color: "text-river",
    bg: "bg-river/10",
  },
  changes_requested: {
    label: "Changes Requested",
    icon: Clock,
    color: "text-river",
    bg: "bg-river/10",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  archived: {
    label: "Archived",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
};

// ─── Water Types ────────────────────────────────────────────────────
// Canonical source: @/lib/constants/water-types
export { WATER_TYPE_LABELS } from "@/lib/constants/water-types";

// ─── Roles ──────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  angler: "Angler",
  landowner: "Landowner",
  club_admin: "Club Admin",
  admin: "Admin",
  guide: "Guide",
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  angler: "text-bronze bg-bronze/10",
  landowner: "text-forest bg-forest/10",
  club_admin: "text-river bg-river/10",
  admin: "text-charcoal bg-charcoal/10",
  guide: "text-charcoal bg-charcoal/10",
};

export { type UserRole } from "@/types/roles";
export const VALID_ROLES = ["landowner", "club_admin", "angler", "admin", "guide"] as const;

// ─── Trip Review Status ──────────────────────────────────────────────

export const TRIP_REVIEW_STATUS: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "text-text-light",
    bg: "bg-offwhite",
  },
  submitted: {
    label: "Submitted",
    icon: Send,
    color: "text-river",
    bg: "bg-river/10",
  },
  published: {
    label: "Published",
    icon: Eye,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  flagged: {
    label: "Flagged",
    icon: Flag,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  suppressed: {
    label: "Suppressed",
    icon: EyeOff,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  removed: {
    label: "Removed",
    icon: Trash2,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

// ─── Trip Proposal Status ──────────────────────────────────────

export const PROPOSAL_STATUS: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "text-text-light",
    bg: "bg-offwhite",
  },
  sent: {
    label: "Sent",
    icon: Send,
    color: "text-river",
    bg: "bg-river/10",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  expired: {
    label: "Expired",
    icon: Clock,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
};

// ─── Guide Affiliation Status ──────────────────────────────────────

export const AFFILIATION_STATUS: Record<string, StatusConfig> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  active: {
    label: "Active",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  revoked: {
    label: "Revoked",
    icon: Ban,
    color: "text-text-light",
    bg: "bg-stone-light/10",
  },
};

// ─── Referral Credit Status ─────────────────────────────────────────

export const REFERRAL_CREDIT_STATUS: Record<string, StatusConfig> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  earned: {
    label: "Earned",
    icon: CheckCircle2,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  paid_out: {
    label: "Paid Out",
    icon: CheckCircle2,
    color: "text-river",
    bg: "bg-river/10",
  },
  voided: {
    label: "Voided",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
};

// ─── Period Options (analytics dashboards) ──────────────────────────

export interface PeriodOption {
  label: string;
  value: number;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "1 year", value: 365 },
];
