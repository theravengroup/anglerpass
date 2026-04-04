'use client';

import {
  ASSIGNABLE_CLUB_ROLES,
  CLUB_ROLE_LABELS,
  CLUB_ROLE_DESCRIPTIONS,
  CLUB_ROLE_PERMISSION_SUMMARIES,
  type ClubRole,
} from '@/lib/permissions/constants';
import RolePermissionCard from '@/components/shared/RolePermissionCard';

interface ClubStaffRoleSelectorProps {
  value: ClubRole | '';
  onChange: (role: ClubRole) => void;
}

export default function ClubStaffRoleSelector({ value, onChange }: ClubStaffRoleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Select Role
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {ASSIGNABLE_CLUB_ROLES.map((role) => (
          <RolePermissionCard
            key={role}
            label={CLUB_ROLE_LABELS[role]}
            description={CLUB_ROLE_DESCRIPTIONS[role]}
            permissions={CLUB_ROLE_PERMISSION_SUMMARIES[role]}
            variant="compact"
            isSelectable
            isActive={value === role}
            onSelect={() => onChange(role)}
          />
        ))}
      </div>
    </div>
  );
}
