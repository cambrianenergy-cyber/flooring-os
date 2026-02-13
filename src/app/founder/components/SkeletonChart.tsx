import React from "react";

interface SkeletonChartProps {
  height?: number;
  className?: string;
}

const SkeletonChart: React.FC<SkeletonChartProps> = ({
  height = 180,
  className = "",
}) => (
  <div
    className={`bg-white rounded-lg shadow p-4 flex flex-col items-center ${className}`}
    style={{ height }}
  >
    <div className="w-full h-full flex items-end gap-2">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded animate-pulse"
          style={{
            width: "12.5%",
            height: `${Math.random() * 0.7 + 0.3}em`,
            minHeight: "30px",
            maxHeight: "100%",
          }}
        />
      ))}
    </div>
  </div>
);

export default SkeletonChart;
