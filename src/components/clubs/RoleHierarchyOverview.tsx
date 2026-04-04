'use client';

import {
  ASSIGNABLE_CLUB_ROLES,
  CLUB_ROLE_LABELS,
  CLUB_ROLE_DESCRIPTIONS,
  CLUB_ROLE_PERMISSION_SUMMARIES,
  type ClubRole,
} from '@/lib/permissions/constants';
import RolePermissionCard from '@/components/shared/RolePermissionCard';

export default function RoleHierarchyOverview() {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">Available Staff Roles</h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Each role grants specific permissions. Click to see what each role can do.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ASSIGNABLE_CLUB_ROLES.map((role) => (
          <RolePermissionCard
            key={role}
            label={CLUB_ROLE_LABELS[role]}
            description={CLUB_ROLE_DESCRIPTIONS[role]}
            permissions={CLUB_ROLE_PERMISSION_SUMMARIES[role]}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}
