"use client";

import { createContext, useContext } from "react";
import type { PlatformRole } from "@/lib/permissions/constants";

const StaffRoleContext = createContext<PlatformRole>("readonly_internal");

export function StaffRoleProvider({
  role,
  children,
}: {
  role: PlatformRole;
  children: React.ReactNode;
}) {
  return (
    <StaffRoleContext value={role}>
      {children}
    </StaffRoleContext>
  );
}

export function useStaffRole(): PlatformRole {
  return useContext(StaffRoleContext);
}
