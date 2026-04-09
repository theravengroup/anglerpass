interface MonthlyDataPoint {
  month: string;
  amount: number;
}

interface MonthlyBarChartProps {
  data: MonthlyDataPoint[];
  /** Tailwind bg class for bars, e.g. "bg-forest" */
  color: string;
}

export default function MonthlyBarChart({ data, color }: MonthlyBarChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="flex h-[120px] items-end gap-1.5">
      {data.map((d) => {
        const pct = (d.amount / max) * 100;
        const label = new Date(d.month + "-01").toLocaleDateString("en-US", {
          month: "short",
        });
        return (
          <div
            key={d.month}
            className="group flex flex-1 flex-col items-center gap-1"
          >
            <span className="text-[10px] text-text-light opacity-0 transition-opacity group-hover:opacity-100">
              ${d.amount.toLocaleString()}
            </span>
            <div className="w-full overflow-hidden rounded-t">
              {/* Dynamic height requires inline style -- percentage computed from data */}
              <div
                className={`w-full min-h-[2px] rounded-t ${color} transition-all`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-text-light">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
