import React from "react";

interface BillingTrendPanelProps {
  data: { date: string; pastDueCount: number }[];
}

const BillingTrendPanel: React.FC<BillingTrendPanelProps> = ({ data }) => {
  // Simple SVG line chart for demo
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.pastDueCount));
  const width = 300;
  const height = 60;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d.pastDueCount / (max || 1)) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-1">
        Past Due Trend (last {data.length} days)
      </div>
      <svg width={width} height={height} className="bg-gray-50 rounded">
        <polyline
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          points={points}
        />
      </svg>
    </div>
  );
};

export default BillingTrendPanel;
