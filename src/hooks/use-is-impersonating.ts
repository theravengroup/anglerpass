"use client";

import { createContext, useContext } from "react";

/**
 * Context for tracking whether the current session is an admin impersonation.
 *
 * When impersonation is active, components should:
 * - Disable all write operations (form submissions, bookings, edits)
 * - Show a visual indicator that the session is read-only
 * - Never allow financial transactions
 *
 * The context is set by ImpersonationBanner in the root layout and
 * consumed by any component that needs to know.
 */
export const ImpersonationContext = createContext<boolean>(false);

/**
 * Returns true if the current session is an admin impersonation.
 *
 * Usage:
 * ```tsx
 * const isImpersonating = useIsImpersonating();
 * if (isImpersonating) {
 *   return <p>Read-only mode during impersonation</p>;
 * }
 * ```
 */
export function useIsImpersonating(): boolean {
  return useContext(ImpersonationContext);
}
