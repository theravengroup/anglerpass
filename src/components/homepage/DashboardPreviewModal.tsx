'use client';

import { useState, useEffect, useCallback } from 'react';

const DASHBOARDS = [
  {
    key: 'landowner',
    label: 'Landowner Dashboard',
    description: 'Manage your properties, track bookings, and control access to your private waters.',
    features: [
      'Property listings with photos, pricing, and availability',
      'Booking request management and calendar',
      'Revenue tracking and analytics',
      'Access controls and gate code management',
    ],
    accent: 'var(--forest)',
    accentLight: 'rgba(26,58,42,.08)',
  },
  {
    key: 'club',
    label: 'Club Dashboard',
    description: 'Run your fly fishing club with modern tools for memberships, scheduling, and communication.',
    features: [
      'Member roster and membership tiers',
      'Water access scheduling and rotation',
      'Event planning and group bookings',
      'Club communications and announcements',
    ],
    accent: 'var(--river)',
    accentLight: 'rgba(58,107,124,.08)',
  },
  {
    key: 'angler',
    label: 'Angler Dashboard',
    description: 'Discover private waters, book fishing days, and manage your upcoming trips.',
    features: [
      'Browse and search private water listings',
      'Book fishing days with instant confirmation',
      'Trip history and upcoming reservations',
      'Saved properties and favorites',
    ],
    accent: 'var(--bronze)',
    accentLight: 'rgba(154,115,64,.08)',
  },
] as const;

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

  return (
    <div className="footer-modal-overlay" onClick={onClose}>
      <div
        className="footer-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680 }}
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

            {/* Dashboard content preview */}
            <div style={{ padding: 28 }}>
              {/* Header area */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: dashboard.accentLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: dashboard.accent, opacity: 0.7 }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>
                    {dashboard.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>AnglerPass Platform</div>
                </div>
              </div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px 12px',
                      background: dashboard.accentLight,
                      borderRadius: 8,
                      border: `1px solid ${dashboard.accent}15`,
                    }}
                  >
                    <div style={{ width: '60%', height: 8, background: `${dashboard.accent}20`, borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ fontSize: 22, fontWeight: 600, color: dashboard.accent, fontFamily: 'var(--heading)' }}>
                      {i === 1 ? '—' : i === 2 ? '—' : '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Content rows */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {dashboard.features.map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 0',
                      borderBottom: i < dashboard.features.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dashboard.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
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
