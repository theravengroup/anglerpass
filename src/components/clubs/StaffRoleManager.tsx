'use client';

import { useState } from 'react';
import {
  ASSIGNABLE_CLUB_ROLES,
  CLUB_ROLE_LABELS,
  type ClubRole,
} from '@/lib/permissions/constants';
import { Shield, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  status: string;
}

interface StaffRoleManagerProps {
  clubId: string;
  member: Member;
  isOwner: boolean;
  onRoleChanged?: () => void;
}

export default function StaffRoleManager({
  clubId,
  member,
  isOwner,
  onRoleChanged,
}: StaffRoleManagerProps) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  async function handleRoleChange(newRole: string) {
    if (newRole === member.role) return;
    setError('');
    setUpdating(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update role');
      }

      onRoleChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  }

  // Only owners can assign staff roles
  if (!isOwner) {
    return (
      <span className="inline-block rounded px-2 py-0.5 text-xs font-medium text-river bg-river/10">
        {CLUB_ROLE_LABELS[member.role as ClubRole] ?? member.role}
      </span>
    );
  }

  // Cannot change the owner's role
  if (member.role === 'admin' || member.role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-forest bg-forest/10">
        <Shield className="size-3" />
        Owner
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={member.role}
        onChange={(e) => handleRoleChange(e.target.value)}
        disabled={updating}
        className="rounded border border-parchment bg-offwhite px-2 py-1 text-xs text-text-primary disabled:opacity-50"
        aria-label={`Change role for ${member.display_name}`}
      >
        <option value="member">Member</option>
        {ASSIGNABLE_CLUB_ROLES.map((role) => (
          <option key={role} value={role}>
            {CLUB_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      {updating && <Loader2 className="size-3 animate-spin text-text-light" />}
      {error && (
        <span className="text-xs text-red-500" role="alert" aria-live="polite">
          {error}
        </span>
      )}
    </div>
  );
}
