import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeeItem {
  label: string;
  amount: number;
  /** Tailwind bg class, e.g. "bg-forest" */
  color: string;
}

interface BookingFeeBreakdownProps {
  items: FeeItem[];
}

export default function BookingFeeBreakdown({
  items,
}: BookingFeeBreakdownProps) {
  const filtered = items.filter((f) => f.amount > 0);
  const total = filtered.reduce((sum, f) => sum + f.amount, 0);

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Booking Fee Breakdown</CardTitle>
        <CardDescription>Where your booking dollars go</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-text-light">
            No spending data yet.
          </p>
        ) : (
          <>
            {/* Stacked bar */}
            <div className="flex h-4 overflow-hidden rounded-full">
              {filtered.map((f) => (
                <div
                  key={f.label}
                  className={`${f.color} transition-all`}
                  style={{ width: `${(f.amount / total) * 100}%` }}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="space-y-2">
              {filtered.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-sm ${f.color}`} />
                    <span className="text-text-secondary">{f.label}</span>
                  </div>
                  <span className="font-medium text-text-primary">
                    ${f.amount.toLocaleString()} (
                    {Math.round((f.amount / total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
