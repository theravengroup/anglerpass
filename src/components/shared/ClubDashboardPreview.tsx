import { StatCard, SectionLabel } from './DashboardPreviewHelpers';

const STATS = [
  { label: 'Active Members', value: '48', sub: '3 pending', subColor: 'text-river' },
  { label: 'Waters Access', value: '5', sub: '+2 cross-club' },
  { label: 'This Month', value: '23', sub: 'fishing days booked' },
] as const;

const APPLICATIONS = [
  { name: 'David Park', ref: 'Referred by J. Adams', exp: '8 yrs fly fishing', applied: 'Mar 25' },
  { name: 'Lisa Moreno', ref: 'Referred by T. Wells', exp: '12 yrs fly fishing', applied: 'Mar 22' },
  { name: 'Kevin O\u2019Brien', ref: 'Direct application', exp: '3 yrs fly fishing', applied: 'Mar 20' },
] as const;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const ANGLER_COUNTS = [2, 0, 4, 1, 3, 6, 5] as const;

export default function ClubDashboardPreview() {
  return (
    <div className="p-6 min-w-[580px]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-base font-semibold text-text-primary font-heading">Madison River Club</div>
          <div className="text-xs text-text-light">Standard Plan &middot; Cross-club access enabled</div>
        </div>
        <div className="py-1 px-3 rounded-md bg-river/[0.07] text-[11px] font-semibold text-river">48 members</div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} accentColor="text-river" bgClass="bg-river/[0.07]" />
        ))}
      </div>

      <SectionLabel>Member Applications</SectionLabel>
      <div className="border border-parchment rounded-lg overflow-hidden mb-4">
        {APPLICATIONS.map((app, i) => (
          <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 text-xs ${i < 2 ? 'border-b border-parchment' : ''}`}>
            <div className="flex-1">
              <span className="font-semibold text-text-primary">{app.name}</span>
              <span className="text-text-light ml-1.5">{app.ref}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-text-light">{app.exp}</span>
              <span className="px-2.5 py-0.5 rounded bg-river text-white text-[10px] font-semibold">Review</span>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>This Week&rsquo;s Schedule</SectionLabel>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-text-light mb-1">{day}</div>
        ))}
        {ANGLER_COUNTS.map((count, i) => (
          <div
            key={i}
            className={`text-center py-2 rounded-md border ${
              count > 0
                ? 'bg-river/[0.07] border-river/15'
                : 'bg-offwhite border-parchment'
            }`}
          >
            <div className={`text-base font-semibold font-heading ${count > 0 ? 'text-river' : 'text-text-light'}`}>
              {count || '\u2014'}
            </div>
            <div className="text-[9px] text-text-light">{count > 0 ? 'anglers' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
