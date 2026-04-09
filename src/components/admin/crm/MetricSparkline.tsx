"use client";

interface MetricSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

/**
 * Tiny SVG sparkline chart for showing 7-day metric trends.
 * No external charting library — just a polyline.
 */
export default function MetricSparkline({
  data,
  color = "currentColor",
  height = 32,
  width = 80,
}: MetricSparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((value, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  // Fill area under the line
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
  const fillPoints = `${firstX},${height - padding} ${points} ${lastX},${height - padding}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polygon
        points={fillPoints}
        fill={color}
        fillOpacity={0.1}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
