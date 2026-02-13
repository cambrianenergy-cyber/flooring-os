import React from "react";

interface SeverityBadgeProps {
  value: "low" | "medium" | "high" | string;
}

const colorMap: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-red-100 text-red-800 border-red-300",
};

const labelMap: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ value }) => {
  const color = colorMap[value] || "bg-gray-100 text-gray-600 border-gray-300";
  const label = labelMap[value] || value;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${color}`}
    >
      {label}
    </span>
  );
};

export default SeverityBadge;
