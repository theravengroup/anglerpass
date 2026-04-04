'use client';

import { useState, useEffect } from 'react';
import {
  DELEGATE_LEVEL_LABELS,
  DELEGATE_LEVEL_DESCRIPTIONS,
  type DelegateLevel,
} from '@/lib/permissions/constants';
import { UserPlus, X, Eye, PenLine, Loader2, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import DelegateRoleExplainer from '@/components/angler/DelegateRoleExplainer';
import RoleBadge from '@/components/shared/RoleBadge';

interface Delegate {
  id: string;
  delegate_id: string | null;
  delegate_email: string;
  delegate_name: string | null;
  access_level: DelegateLevel;
  status: string;
  granted_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

export default function DelegateManager() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLevel, setInviteLevel] = useState<DelegateLevel>('viewer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchDelegates() {
    try {
      const res = await fetch('/api/delegates');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setDelegates(data.delegates ?? []);
    } catch {
      setError('Failed to load delegates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDelegates();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/delegates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, access_level: inviteLevel }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to invite');

      setSuccess(`Delegate invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInvite(false);
      fetchDelegates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite delegate');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Are you sure you want to revoke this delegate\'s access?')) return;
    setError('');

    try {
      const res = await fetch(`/api/delegates/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to revoke');
      }
      setSuccess('Delegate access revoked');
      fetchDelegates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke');
    }
  }

  async function handleUpdateLevel(id: string, newLevel: DelegateLevel) {
    setError('');

    try {
      const res = await fetch(`/api/delegates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_level: newLevel }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update');
      }
      fetchDelegates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  const activeDelegates = delegates.filter((d) => d.status !== 'revoked');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-text-light" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            Trusted Delegates
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Add a spouse, partner, or assistant to view or manage your bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRoleGuide(!showRoleGuide)}
            className="inline-flex items-center gap-2 rounded-lg border border-parchment bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-offwhite"
          >
            {showRoleGuide ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            Access Levels
          </button>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-deep"
          >
            <UserPlus className="size-4" />
            Add Delegate
          </button>
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
      {showRoleGuide && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">What can delegates do?</h3>
          <DelegateRoleExplainer />
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="rounded-lg border border-parchment bg-white p-5 space-y-4"
        >
          <div>
            <label htmlFor="delegate-email" className="block text-sm font-medium text-text-primary mb-1">
              Email Address
            </label>
            <input
              id="delegate-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="delegate@example.com"
              required
              className="w-full rounded-lg border border-parchment bg-offwhite px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Access Level
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['viewer', 'booking_manager'] as const).map((level) => (
                <label
                  key={level}
                  className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                    inviteLevel === level
                      ? 'border-forest bg-forest/5 ring-1 ring-forest/20'
                      : 'border-parchment bg-white hover:border-stone-light'
                  }`}
                >
                  <input
                    type="radio"
                    name="access_level"
                    value={level}
                    checked={inviteLevel === level}
                    onChange={() => setInviteLevel(level)}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1.5 ${
                      level === 'viewer' ? 'bg-river/10 text-river' : 'bg-bronze/10 text-bronze'
                    }`}>
                      {level === 'viewer' ? <Eye className="size-4" /> : <PenLine className="size-4" />}
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-text-primary">
                        {DELEGATE_LEVEL_LABELS[level]}
                      </span>
                      <span className="block text-xs text-text-secondary mt-0.5">
                        {DELEGATE_LEVEL_DESCRIPTIONS[level]}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-deep disabled:opacity-50"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Send Invitation
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active delegates list */}
      {activeDelegates.length === 0 && !showInvite ? (
        <div className="rounded-lg border border-parchment bg-white px-6 py-10 text-center">
          <Shield className="mx-auto size-10 text-stone-light" />
          <p className="mt-3 text-sm font-medium text-text-primary">No delegates yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Add a trusted person to help manage your fishing bookings.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-parchment rounded-lg border border-parchment bg-white">
          {activeDelegates.map((d) => (
            <div key={d.id} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${
                    d.access_level === 'viewer'
                      ? 'bg-river/10 text-river'
                      : 'bg-bronze/10 text-bronze'
                  }`}>
                    {d.access_level === 'viewer'
                      ? <Eye className="size-4" />
                      : <PenLine className="size-4" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {d.delegate_name ?? d.delegate_email}
                    </p>
                    {d.delegate_name && (
                      <p className="text-xs text-text-secondary">{d.delegate_email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        d.status === 'active'
                          ? 'text-forest bg-forest/10'
                          : 'text-bronze bg-bronze/10'
                      }`}>
                        {d.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                      <RoleBadge role={d.access_level} scope="consumer" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={d.access_level}
                    onChange={(e) => handleUpdateLevel(d.id, e.target.value as DelegateLevel)}
                    className="rounded border border-parchment bg-offwhite px-2 py-1 text-xs text-text-secondary"
                    aria-label={`Change access level for ${d.delegate_name ?? d.delegate_email}`}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="booking_manager">Booking Manager</option>
                  </select>
                  <button
                    onClick={() => handleRevoke(d.id)}
                    className="rounded p-1.5 text-text-light transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label={`Revoke access for ${d.delegate_name ?? d.delegate_email}`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              {/* Permission context line */}
              <p className="mt-1.5 ml-11 text-[11px] text-text-light">
                {DELEGATE_LEVEL_DESCRIPTIONS[d.access_level]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
