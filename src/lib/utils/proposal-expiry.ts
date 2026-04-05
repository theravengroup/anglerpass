/**
 * Utility for computing proposal expiry display info.
 */

export interface ExpiryInfo {
  /** Human-readable label like "Expires in 6h" or "Expired" */
  label: string | null;
  /** True if the proposal has expired */
  isExpired: boolean;
  /** True if expiry is within 6 hours (urgent styling) */
  isUrgent: boolean;
}

/**
 * Compute expiry display info from an ISO timestamp.
 * Returns null label if no expiry is set.
 */
export function getExpiryInfo(expiresAt: string | null): ExpiryInfo {
  if (!expiresAt) {
    return { label: null, isExpired: false, isUrgent: false };
  }

  const now = Date.now();
  const expiryMs = new Date(expiresAt).getTime();
  const diffMs = expiryMs - now;

  if (diffMs <= 0) {
    return { label: "Expired", isExpired: true, isUrgent: false };
  }

  const diffHours = diffMs / (1000 * 60 * 60);
  const isUrgent = diffHours < 6;

  if (diffHours < 1) {
    const mins = Math.ceil(diffMs / (1000 * 60));
    return { label: `Expires in ${mins}m`, isExpired: false, isUrgent: true };
  }

  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    return {
      label: `Expires in ${hours}h`,
      isExpired: false,
      isUrgent,
    };
  }

  const days = Math.floor(diffHours / 24);
  return {
    label: `Expires in ${days}d`,
    isExpired: false,
    isUrgent: false,
  };
}
