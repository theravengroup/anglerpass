'use client';

/**
 * Inline dashboard preview sections for audience marketing pages.
 * Each role gets a contextual preview showing what their dashboard looks like.
 *
 * Role-specific dashboard components are in separate files:
 * - LandownerDashboardPreview
 * - ClubDashboardPreview
 * - AnglerDashboardPreview
 * - GuideDashboardPreview
 */

import { BrowserChrome } from './DashboardPreviewHelpers';
import LandownerDashboardPreview from './LandownerDashboardPreview';
import ClubDashboardPreview from './ClubDashboardPreview';
import AnglerDashboardPreview from './AnglerDashboardPreview';
import GuideDashboardPreview from './GuideDashboardPreview';

/* ──────────────────── Config ──────────────────── */

type Role = 'landowner' | 'club' | 'angler' | 'guide';

const CONFIG: Record<Role, { url: string; accentColor: string; description: string; Component: () => React.JSX.Element }> = {
  landowner: {
    url: 'app.anglerpass.com/landowner',
    accentColor: 'forest',
    description: 'Manage your properties, track bookings and revenue, and see who\u2019s on your water \u2014 all from one dashboard.',
    Component: LandownerDashboardPreview,
  },
  club: {
    url: 'app.anglerpass.com/club',
    accentColor: 'river',
    description: 'Vet members, coordinate schedules, manage water access, and track your club\u2019s activity in one place.',
    Component: ClubDashboardPreview,
  },
  angler: {
    url: 'app.anglerpass.com/angler',
    accentColor: 'bronze',
    description: 'Browse waters your club has access to, book fishing days, and manage your upcoming trips.',
    Component: AnglerDashboardPreview,
  },
  guide: {
    url: 'app.anglerpass.com/guide',
    accentColor: 'charcoal',
    description: 'View your upcoming schedule, track earnings, manage your rates, and see which waters you\u2019re approved to guide on.',
    Component: GuideDashboardPreview,
  },
};

/* ──────────────────── Exported Section ──────────────────── */

export default function DashboardPreviewSection({ role }: { role: Role }) {
  const { url, accentColor, description, Component } = CONFIG[role];

  return (
    <section className="py-[100px] bg-offwhite">
      <div className="max-w-[900px] mx-auto px-8">
        <div className="reveal text-center mb-12">
          <span className={`inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-${accentColor}`}>
            Dashboard Preview
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
            See what your dashboard looks like
          </h2>
          <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
            {description}
          </p>
        </div>

        <div className="reveal d2">
          <BrowserChrome url={url}>
            <Component />
          </BrowserChrome>
        </div>

        <p className="text-center text-[12px] text-text-light mt-5 italic">
          Dashboards are under active development. Join the waitlist to get early access.
        </p>
      </div>
    </section>
  );
}
