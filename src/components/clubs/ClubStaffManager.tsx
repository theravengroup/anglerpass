'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, UserPlus, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CLUB_ROLE_LABELS,
  CLUB_ROLE_DESCRIPTIONS,
  CLUB_ROLE_HIERARCHY,
  CLUB_STAFF_ROLES,
  ASSIGNABLE_CLUB_ROLES,
  type ClubRole,
} from '@/lib/permissions/constants';
import RoleBadge from '@/components/shared/RoleBadge';
import RoleHierarchyOverview from '@/components/clubs/RoleHierarchyOverview';
import ClubStaffRoleSelector from '@/components/clubs/ClubStaffRoleSelector';

interface StaffMember {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: ClubRole;
  joined_at: string;
}

interface ClubStaffManagerProps {
  clubId: string;
  isOwner: boolean;
}

export default function ClubStaffManager({ clubId, isOwner }: ClubStaffManagerProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPromote, setShowPromote] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRole, setSelectedRole] = useState<ClubRole | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/clubs/${clubId}/staff`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStaff(data.staff ?? []);
      setMembers(data.members ?? []);
    } catch {
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember || !selectedRole) return;
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: selectedMember, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to assign role');

      setSuccess(`Staff role assigned successfully`);
      setShowPromote(false);
      setSelectedMember('');
      setSelectedRole('');
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemote(memberId: string) {
    if (!confirm('Remove this person\'s staff role? They will become a regular member.')) return;
    setError('');

    try {
      const res = await fetch(`/api/clubs/${clubId}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, role: 'member' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update');

      setSuccess('Staff role removed');
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function handleChangeRole(memberId: string, newRole: ClubRole) {
    setError('');
    try {
      const res = await fetch(`/api/clubs/${clubId}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update');
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  // Group staff by hierarchy tier
  const ownerStaff = staff.filter((s) => CLUB_ROLE_HIERARCHY[s.role] === 100);
  const adminStaff = staff.filter((s) => CLUB_ROLE_HIERARCHY[s.role] === 80);
  const specializedStaff = staff.filter((s) => CLUB_ROLE_HIERARCHY[s.role] === 40);
  const readonlyStaff = staff.filter((s) => CLUB_ROLE_HIERARCHY[s.role] === 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-text-light" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            Staff Management
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Assign roles to give club members specific permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRoles(!showRoles)}
            className="inline-flex items-center gap-2 rounded-lg border border-parchment bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-offwhite"
          >
            {showRoles ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            Role Guide
          </button>
          {isOwner && (
            <button
              onClick={() => setShowPromote(!showPromote)}
              className="inline-flex items-center gap-2 rounded-lg bg-river px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-river/90"
            >
              <UserPlus className="size-4" />
              Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest" role="alert" aria-live="polite">
          {success}
        </div>
      )}

      {/* Role Guide (collapsible) */}
      {showRoles && <RoleHierarchyOverview />}

      {/* Promote form */}
      {showPromote && isOwner && (
        <form onSubmit={handlePromote} className="rounded-lg border border-parchment bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Add a Staff Member</h3>
          <p className="text-xs text-text-secondary">
            Choose an existing club member and assign them a staff role.
          </p>

          <div>
            <label htmlFor="promote-member" className="block text-sm font-medium text-text-primary mb-1">
              Select Member
            </label>
            <select
              id="promote-member"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              required
              className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-river focus:outline-none focus:ring-1 focus:ring-river"
            >
              <option value="">Choose a member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name} ({m.email})
                </option>
              ))}
            </select>
            {members.length === 0 && (
              <p className="mt-1 text-xs text-text-light">
                All club members already have staff roles.
              </p>
            )}
          </div>

          <ClubStaffRoleSelector value={selectedRole} onChange={setSelectedRole} />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !selectedMember || !selectedRole}
              className="inline-flex items-center gap-2 rounded-lg bg-river px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-river/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Assign Role
            </button>
            <button
              type="button"
              onClick={() => { setShowPromote(false); setSelectedMember(''); setSelectedRole(''); }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Staff Roster */}
      {staff.length === 0 ? (
        <div className="rounded-lg border border-parchment bg-white px-6 py-10 text-center">
          <Shield className="mx-auto size-10 text-stone-light" />
          <p className="mt-3 text-sm font-medium text-text-primary">No staff members yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Assign roles to club members to help manage your club.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Owner tier */}
          {ownerStaff.length > 0 && (
            <StaffTier title="Owner" members={ownerStaff} isOwner={false} />
          )}
          {/* Admin tier */}
          {adminStaff.length > 0 && (
            <StaffTier
              title="Club Admins"
              members={adminStaff}
              isOwner={isOwner}
              onDemote={handleDemote}
              onChangeRole={handleChangeRole}
              clubId={clubId}
            />
          )}
          {/* Specialized staff */}
          {specializedStaff.length > 0 && (
            <StaffTier
              title="Staff"
              members={specializedStaff}
              isOwner={isOwner}
              onDemote={handleDemote}
              onChangeRole={handleChangeRole}
              clubId={clubId}
            />
          )}
          {/* Read-only */}
          {readonlyStaff.length > 0 && (
            <StaffTier
              title="Read-Only Staff"
              members={readonlyStaff}
              isOwner={isOwner}
              onDemote={handleDemote}
              onChangeRole={handleChangeRole}
              clubId={clubId}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Staff Tier Sub-component ──────────────────────────────────────

interface StaffTierProps {
  title: string;
  members: StaffMember[];
  isOwner: boolean;
  onDemote?: (id: string) => void;
  onChangeRole?: (id: string, role: ClubRole) => void;
  clubId?: string;
}

function StaffTier({ title, members, isOwner, onDemote, onChangeRole }: StaffTierProps) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-light">
        {title}
      </h3>
      <div className="divide-y divide-parchment rounded-lg border border-parchment bg-white">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-river/10 text-sm font-semibold text-river">
                {m.display_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{m.display_name}</p>
                <p className="text-xs text-text-secondary">{m.email}</p>
                <p className="mt-0.5 text-[11px] text-text-light">
                  {CLUB_ROLE_DESCRIPTIONS[m.role]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RoleBadge role={m.role} scope="organization" size="md" />

              {isOwner && CLUB_ROLE_HIERARCHY[m.role] < 100 && (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => onChangeRole?.(m.id, e.target.value as ClubRole)}
                    className="rounded border border-parchment bg-offwhite px-2 py-1 text-xs text-text-secondary"
                    aria-label={`Change role for ${m.display_name}`}
                  >
                    {ASSIGNABLE_CLUB_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {CLUB_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onDemote?.(m.id)}
                    className="rounded p-1.5 text-text-light transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label={`Remove staff role for ${m.display_name}`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
