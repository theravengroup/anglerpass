'use client';

import { useState, useEffect, useCallback } from 'react';

const DASHBOARDS = [
  {
    key: 'landowner',
    label: 'Landowner Dashboard',
    description: 'Manage your properties, track bookings, and control access to your private waters.',
  },
  {
    key: 'club',
    label: 'Club Dashboard',
    description: 'Vet members, coordinate schedules, and manage your club\u2019s access to private water.',
  },
  {
    key: 'angler',
    label: 'Angler Dashboard',
    description: 'Browse waters your club has access to, book fishing days, and manage upcoming trips.',
  },
] as const;

/* ──────────────────── Landowner Preview ──────────────────── */
function LandownerPreview() {
  const accent = '#1a3a2a';
  const accentLight = 'rgba(26,58,42,.07)';
  return (
    <div style={{ padding: 24 }}>
      {/* Welcome header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>
            Welcome back, James
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Silver Creek Ranch</div>
        </div>
        <div style={{ padding: '5px 12px', borderRadius: 6, background: accentLight, fontSize: 11, fontWeight: 600, color: accent }}>
          2 properties
        </div>
      </div>

      {/* Revenue + Bookings stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>Revenue (Mar)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>$4,280</div>
          <div style={{ fontSize: 11, color: '#4a8c5c', marginTop: 2 }}>+18% vs Feb</div>
        </div>
        <div style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>Active Bookings</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>7</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>3 this week</div>
        </div>
        <div style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>Occupancy</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>62%</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>Apr: 85%</div>
        </div>
      </div>

      {/* Pending requests */}
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>
        Pending Booking Requests
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {[
          { name: 'M. Thompson', club: 'Trout Unlimited #412', property: 'East Fork', date: 'Apr 4-5', rods: 2 },
          { name: 'R. Chen', club: 'Madison River Club', property: 'East Fork', date: 'Apr 12', rods: 1 },
          { name: 'S. Williams', club: 'Big Sky Anglers', property: 'Elk Meadow', date: 'Apr 18-19', rods: 3 },
        ].map((req, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              fontSize: 12,
              borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
              background: i === 0 ? 'rgba(26,58,42,.03)' : 'transparent',
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.name}</span>
              <span style={{ color: 'var(--text-light)', marginLeft: 6 }}>{req.club}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{req.property}</span>
              <span style={{ color: 'var(--text-light)' }}>{req.date}</span>
              <span style={{ color: 'var(--text-light)' }}>{req.rods} rod{req.rods > 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ padding: '3px 10px', borderRadius: 4, background: accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'default' }}>Approve</span>
                <span style={{ padding: '3px 10px', borderRadius: 4, background: 'var(--offwhite)', color: 'var(--text-light)', fontSize: 10, fontWeight: 600, cursor: 'default' }}>Decline</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Property card */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { name: 'Silver Creek \u2014 East Fork', type: 'River', status: 'Active', next: 'Apr 4' },
          { name: 'Elk Meadow Spring', type: 'Spring Creek', status: 'Active', next: 'Apr 18' },
        ].map((p, i) => (
          <div key={i} style={{ padding: '14px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{p.name}</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-light)' }}>
              <span>{p.type}</span>
              <span style={{ color: '#4a8c5c' }}>{p.status}</span>
              <span>Next: {p.next}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── Club Preview ──────────────────── */
function ClubPreview() {
  const accent = '#3a6b7c';
  const accentLight = 'rgba(58,107,124,.07)';
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>
            Madison River Club
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Standard Plan &middot; Cross-club access enabled</div>
        </div>
        <div style={{ padding: '5px 12px', borderRadius: 6, background: accentLight, fontSize: 11, fontWeight: 600, color: accent }}>
          48 members
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>Active Members</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>48</div>
          <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>3 pending</div>
        </div>
        <div style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>Waters Access</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>5</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>+2 cross-club</div>
        </div>
        <div style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>This Month</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>23</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>fishing days booked</div>
        </div>
      </div>

      {/* Pending applications */}
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>
        Member Applications
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { name: 'David Park', ref: 'Referred by J. Adams', exp: '8 yrs fly fishing', applied: 'Mar 25' },
          { name: 'Lisa Moreno', ref: 'Referred by T. Wells', exp: '12 yrs fly fishing', applied: 'Mar 22' },
          { name: 'Kevin O\u2019Brien', ref: 'Direct application', exp: '3 yrs fly fishing', applied: 'Mar 20' },
        ].map((app, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              fontSize: 12,
              borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.name}</span>
              <span style={{ color: 'var(--text-light)', marginLeft: 6 }}>{app.ref}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ color: 'var(--text-light)' }}>{app.exp}</span>
              <span style={{ padding: '3px 10px', borderRadius: 4, background: accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'default' }}>Review</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly schedule */}
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>
        This Week&rsquo;s Schedule
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-light)', marginBottom: 4 }}>{day}</div>
        ))}
        {[
          { count: 2, color: accentLight },
          { count: 0, color: 'transparent' },
          { count: 4, color: 'rgba(58,107,124,.15)' },
          { count: 1, color: accentLight },
          { count: 3, color: 'rgba(58,107,124,.12)' },
          { count: 6, color: 'rgba(58,107,124,.22)' },
          { count: 5, color: 'rgba(58,107,124,.18)' },
        ].map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              padding: '8px 0',
              borderRadius: 6,
              background: d.count > 0 ? d.color : 'var(--offwhite)',
              border: `1px solid ${d.count > 0 ? accent + '15' : 'var(--border)'}`,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: d.count > 0 ? accent : 'var(--text-light)', fontFamily: 'var(--heading)' }}>{d.count || '\u2014'}</div>
            <div style={{ fontSize: 9, color: 'var(--text-light)' }}>{d.count > 0 ? 'anglers' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── Angler Preview ──────────────────── */
function AnglerPreview() {
  const accent = '#9a7340';
  const accentLight = 'rgba(154,115,64,.07)';
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>
            Welcome back, Sarah
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Madison River Club &middot; Member since 2024</div>
        </div>
        <div style={{ padding: '5px 12px', borderRadius: 6, background: accentLight, fontSize: 11, fontWeight: 600, color: accent }}>
          3 upcoming trips
        </div>
      </div>

      {/* Upcoming trips */}
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>
        Upcoming Trips
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {[
          { property: 'Silver Creek \u2014 East Fork', date: 'Apr 4\u20135', rods: 2, status: 'Confirmed', statusColor: '#4a8c5c' },
          { property: 'Yellowstone Spring', date: 'Apr 18', rods: 1, status: 'Confirmed', statusColor: '#4a8c5c' },
          { property: 'Gallatin Bend (cross-club)', date: 'May 2\u20133', rods: 2, status: 'Pending', statusColor: accent },
        ].map((trip, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: i === 0 ? 'rgba(154,115,64,.03)' : 'transparent',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{trip.property}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{trip.date} &middot; {trip.rods} rod{trip.rods > 1 ? 's' : ''}</div>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 4, background: trip.statusColor + '12', color: trip.statusColor, fontSize: 10, fontWeight: 600 }}>
              {trip.status}
            </span>
          </div>
        ))}
      </div>

      {/* Available waters */}
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>
        Available Waters
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { name: 'Elk Meadow Spring', type: 'Spring Creek', rate: '$225/day', species: 'Brown, Brook', avail: '12 dates in Apr' },
          { name: 'Ruby River \u2014 North', type: 'River', rate: '$300/day', species: 'Rainbow, Brown', avail: '8 dates in Apr' },
          { name: 'Columbine Reservoir', type: 'Stillwater', rate: '$175/day', species: 'Rainbow, Cutthroat', avail: '18 dates in Apr' },
          { name: 'Gallatin Bend', type: 'River \u00b7 Cross-club', rate: '$350/day', species: 'Brown, Rainbow', avail: '5 dates in Apr' },
        ].map((w, i) => (
          <div key={i} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{w.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6 }}>{w.type}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>{w.rate}</span>
              <span style={{ fontSize: 10, color: 'var(--text-light)' }}>{w.species}</span>
            </div>
            <div style={{ fontSize: 10, color: accent, marginTop: 4 }}>{w.avail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PREVIEW_COMPONENTS = [LandownerPreview, ClubPreview, AnglerPreview];

export default function DashboardPreviewModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const dashboard = DASHBOARDS[selected];
  const PreviewComponent = PREVIEW_COMPONENTS[selected];

  return (
    <div className="footer-modal-overlay" onClick={onClose}>
      <div
        className="footer-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720 }}
      >
        <button className="footer-modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="footer-modal-title">Preview Dashboard</h2>

        <div className="footer-modal-body">
          {/* Dropdown */}
          <div style={{ marginBottom: 24 }}>
            <select
              value={selected}
              onChange={(e) => setSelected(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 14,
                fontFamily: 'var(--body)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                background: '#fff',
                border: '1.5px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b60' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                outline: 'none',
                transition: 'border-color .2s',
              }}
            >
              {DASHBOARDS.map((d, i) => (
                <option key={d.key} value={i}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Dashboard Preview Card */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            {/* Faux browser chrome */}
            <div
              style={{
                padding: '10px 16px',
                background: 'var(--offwhite)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ee6a5f' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f5bd4f' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#61c454' }} />
              </div>
              <div
                style={{
                  flex: 1,
                  marginLeft: 8,
                  padding: '4px 12px',
                  background: '#fff',
                  borderRadius: 6,
                  fontSize: 11,
                  color: 'var(--text-light)',
                  fontFamily: 'var(--mono)',
                }}
              >
                app.anglerpass.com/{dashboard.key}
              </div>
            </div>

            {/* Dashboard-specific content */}
            <PreviewComponent />
          </div>

          {/* Description */}
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {dashboard.description}
          </p>

          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic' }}>
            Dashboards are under active development. Sign up to get early access.
          </p>
        </div>
      </div>
    </div>
  );
}
