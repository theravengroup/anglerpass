'use client';

import { useState, useEffect } from 'react';
import {
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLE_DESCRIPTIONS,
  type PlatformRole,
} from '@/lib/permissions/constants';
import { Shield, UserPlus, X, Loader2, AlertTriangle } from 'lucide-react';

interface StaffMember {
  id: string;
  user_id: string;
  role: PlatformRole;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  user_name: string;
  user_email: string | null;
  granted_by_name: string | null;
}

export default function PlatformStaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState<PlatformRole>('support_agent');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchStaff() {
    try {
      const res = await fetch('/api/admin/platform-staff');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStaff(data.staff ?? []);
    } catch {
      setError('Failed to load platform staff');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStaff();
  }, []);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/platform-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: assignUserId, role: assignRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to assign role');

      setSuccess(`Platform staff role assigned successfully`);
      setAssignUserId('');
      setShowAssign(false);
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(userId: string, userName: string) {
    if (!confirm(`Revoke platform staff access for ${userName}? They will lose all elevated permissions.`)) return;
    setError('');

    try {
      const res = await fetch('/api/admin/platform-staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to revoke');
      }
      setSuccess('Platform staff access revoked');
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke');
    }
  }

  const activeStaff = staff.filter((s) => !s.revoked_at);
  const revokedStaff = staff.filter((s) => s.revoked_at);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-text-light" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            Platform Staff Roles
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Assign granular internal roles to AnglerPass team members.
          </p>
        </div>
        <button
          onClick={() => setShowAssign(!showAssign)}
          className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-deep"
        >
          <UserPlus className="size-4" />
          Assign Role
        </button>
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

      {/* Assign form */}
      {showAssign && (
        <form
          onSubmit={handleAssign}
          className="rounded-lg border border-parchment bg-white p-5 space-y-4"
        >
          <div>
            <label htmlFor="staff-user-id" className="block text-sm font-medium text-text-primary mb-1">
              User ID
            </label>
            <input
              id="staff-user-id"
              type="text"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              placeholder="Paste the user's UUID"
              required
              className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm font-mono focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
            <p className="mt-1 text-xs text-text-light">
              Find user IDs in the User Management page.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Platform Role
            </label>
            <div className="space-y-2">
              {PLATFORM_ROLES.map((role) => (
                <label
                  key={role}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    assignRole === role
                      ? 'border-forest bg-forest/5'
                      : 'border-parchment bg-white hover:border-stone-light'
                  }`}
                >
                  <input
                    type="radio"
                    name="platform_role"
                    value={role}
                    checked={assignRole === role}
                    onChange={() => setAssignRole(role)}
                    className="mt-1"
                  />
                  <div>
                    <span className="block text-sm font-medium text-text-primary">
                      {PLATFORM_ROLE_LABELS[role]}
                    </span>
                    <span className="block text-xs text-text-secondary mt-0.5">
                      {PLATFORM_ROLE_DESCRIPTIONS[role]}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {assignRole === 'super_admin' && (
            <div className="flex items-start gap-2 rounded-lg border border-bronze/30 bg-bronze/5 px-4 py-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-bronze" />
              <p className="text-xs text-bronze">
                Super Admin has unrestricted access to the entire platform including
                impersonation and configuration changes. Assign with care.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-deep disabled:opacity-50"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Assign Role
            </button>
            <button
              type="button"
              onClick={() => setShowAssign(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active staff list */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Active Staff ({activeStaff.length})
        </h3>
        {activeStaff.length === 0 ? (
          <div className="rounded-lg border border-parchment bg-white px-6 py-8 text-center">
            <Shield className="mx-auto size-8 text-stone-light" />
            <p className="mt-2 text-sm text-text-secondary">No platform staff assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-parchment rounded-lg border border-parchment bg-white">
            {activeStaff.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-charcoal/10 p-2 text-charcoal">
                    <Shield className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {s.user_name}
                    </p>
                    {s.user_email && (
                      <p className="text-xs text-text-secondary">{s.user_email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-block rounded bg-charcoal/10 px-1.5 py-0.5 text-[11px] font-medium text-charcoal">
                        {PLATFORM_ROLE_LABELS[s.role]}
                      </span>
                      <span className="text-[11px] text-text-light">
                        Since {new Date(s.granted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(s.user_id, s.user_name)}
                  className="rounded p-1.5 text-text-light transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label={`Revoke access for ${s.user_name}`}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revoked staff */}
      {revokedStaff.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-light mb-3">
            Previously Revoked ({revokedStaff.length})
          </h3>
          <div className="divide-y divide-parchment rounded-lg border border-parchment bg-white opacity-60">
            {revokedStaff.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-text-secondary">{s.user_name}</p>
                  <p className="text-xs text-text-light">
                    {PLATFORM_ROLE_LABELS[s.role]} — revoked {new Date(s.revoked_at!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
