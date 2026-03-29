import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  UserMinus,
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

// ─── Water Types ────────────────────────────────────────────────────

export const WATER_TYPE_LABELS: Record<string, string> = {
  river: "River",
  stream: "Stream",
  lake: "Lake",
  pond: "Pond",
  spring_creek: "Spring Creek",
  tailwater: "Tailwater",
  reservoir: "Reservoir",
};

// ─── Roles ──────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  angler: "Angler",
  landowner: "Landowner",
  club_admin: "Club Admin",
  admin: "Admin",
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  angler: "text-bronze bg-bronze/10",
  landowner: "text-forest bg-forest/10",
  club_admin: "text-river bg-river/10",
  admin: "text-charcoal bg-charcoal/10",
};

export const VALID_ROLES = ["landowner", "club_admin", "angler", "admin"] as const;
export type UserRole = (typeof VALID_ROLES)[number];

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
