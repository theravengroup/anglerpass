import { StatCard, SectionLabel } from './DashboardPreviewHelpers';

const STATS = [
  { label: 'Earnings (Mar)', value: '$3,150', sub: '9 trips completed', subColor: 'text-forest' },
  { label: 'Upcoming Trips', value: '4', sub: 'Next: Apr 4' },
  { label: 'Rating', value: '4.9', sub: '37 reviews' },
] as const;

const SCHEDULE = [
  { angler: 'M. Thompson', property: 'Silver Creek \u2014 East Fork', date: 'Apr 4\u20135', party: 2, rate: '$350/day' },
  { angler: 'J. Adams', property: 'Elk Meadow Spring', date: 'Apr 12', party: 1, rate: '$400/day' },
  { angler: 'K. Rivera', property: 'Ruby River \u2014 North', date: 'Apr 18', party: 3, rate: '$350/day' },
  { angler: 'S. Williams', property: 'Gallatin Bend', date: 'Apr 22\u201323', party: 2, rate: '$375/day' },
] as const;

const APPROVED_WATERS = [
  'Silver Creek \u2014 East Fork',
  'Elk Meadow Spring',
  'Ruby River \u2014 North',
  'Gallatin Bend',
] as const;

export default function GuideDashboardPreview() {
  return (
    <div className="p-6 min-w-[580px]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-base font-semibold text-text-primary font-heading">Welcome back, Tom</div>
          <div className="text-xs text-text-light">Licensed Guide &middot; Montana #4821</div>
        </div>
        <div className="py-1 px-3 rounded-md bg-charcoal/[0.07] text-[11px] font-semibold text-charcoal">Approved</div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} accentColor="text-charcoal" bgClass="bg-charcoal/[0.07]" />
        ))}
      </div>

      <SectionLabel>Upcoming Schedule</SectionLabel>
      <div className="border border-parchment rounded-lg overflow-hidden mb-4">
        {SCHEDULE.map((trip, i) => (
          <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 text-xs ${i < 3 ? 'border-b border-parchment' : ''}`}>
            <div className="flex-1">
              <span className="font-semibold text-text-primary">{trip.angler}</span>
              <span className="text-text-light ml-1.5">{trip.property}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-text-light">{trip.date}</span>
              <span className="text-text-light">{trip.party} angler{trip.party > 1 ? 's' : ''}</span>
              <span className="font-semibold text-charcoal">{trip.rate}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 border border-parchment rounded-lg">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-text-light mb-2">Approved Waters</div>
          {APPROVED_WATERS.map((w) => (
            <div key={w} className="text-xs text-text-primary py-1 border-b border-parchment last:border-b-0">{w}</div>
          ))}
        </div>
        <div className="p-3.5 border border-parchment rounded-lg">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-text-light mb-2">Your Rates</div>
          <div className="flex justify-between py-1.5 border-b border-parchment text-xs">
            <span className="text-text-secondary">Full day</span>
            <span className="font-semibold text-charcoal">$350&ndash;400</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-parchment text-xs">
            <span className="text-text-secondary">Half day</span>
            <span className="font-semibold text-charcoal">$225</span>
          </div>
          <div className="flex justify-between py-1.5 text-xs">
            <span className="text-text-secondary">Service fee</span>
            <span className="text-text-light">10% (paid by angler)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
