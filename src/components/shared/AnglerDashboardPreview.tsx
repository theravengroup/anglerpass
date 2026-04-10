import { SectionLabel } from './DashboardPreviewHelpers';

const TRIPS = [
  { property: 'Silver Creek \u2014 East Fork', date: 'Apr 4\u20135', rods: 2, status: 'Confirmed', confirmed: true },
  { property: 'Yellowstone Spring', date: 'Apr 18', rods: 1, status: 'Confirmed', confirmed: true },
  { property: 'Gallatin Bend (cross-club)', date: 'May 2\u20133', rods: 2, status: 'Pending', confirmed: false },
] as const;

const WATERS = [
  { name: 'Elk Meadow Spring', type: 'Spring Creek', rate: '$225/day', species: 'Brown, Brook', avail: '12 dates in Apr' },
  { name: 'Ruby River \u2014 North', type: 'River', rate: '$300/day', species: 'Rainbow, Brown', avail: '8 dates in Apr' },
  { name: 'Columbine Reservoir', type: 'Stillwater', rate: '$175/day', species: 'Rainbow, Cutthroat', avail: '18 dates in Apr' },
  { name: 'Gallatin Bend', type: 'River \u00b7 Cross-club', rate: '$350/day', species: 'Brown, Rainbow', avail: '5 dates in Apr' },
] as const;

export default function AnglerDashboardPreview() {
  return (
    <div className="p-6 min-w-[580px]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-base font-semibold text-text-primary font-heading">Welcome back, Sarah</div>
          <div className="text-xs text-text-light">Madison River Club &middot; Member since 2024</div>
        </div>
        <div className="py-1 px-3 rounded-md bg-bronze/[0.07] text-[11px] font-semibold text-bronze">3 upcoming trips</div>
      </div>

      <SectionLabel>Upcoming Trips</SectionLabel>
      <div className="flex flex-col gap-2 mb-5">
        {TRIPS.map((trip, i) => (
          <div key={i} className={`flex items-center justify-between p-3.5 border border-parchment rounded-lg ${i === 0 ? 'bg-bronze/[0.03]' : ''}`}>
            <div>
              <div className="text-[13px] font-semibold text-text-primary">{trip.property}</div>
              <div className="text-[11px] text-text-light mt-0.5">{trip.date} &middot; {trip.rods} rod{trip.rods > 1 ? 's' : ''}</div>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold ${
              trip.confirmed
                ? 'bg-forest/[0.07] text-forest'
                : 'bg-bronze/[0.07] text-bronze'
            }`}>
              {trip.status}
            </span>
          </div>
        ))}
      </div>

      <SectionLabel>Available Waters</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {WATERS.map((w, i) => (
          <div key={i} className="p-3.5 border border-parchment rounded-lg">
            <div className="text-[13px] font-semibold text-text-primary mb-0.5">{w.name}</div>
            <div className="text-[11px] text-text-light mb-1.5">{w.type}</div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-bronze">{w.rate}</span>
              <span className="text-[10px] text-text-light">{w.species}</span>
            </div>
            <div className="text-[10px] text-bronze mt-1">{w.avail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
