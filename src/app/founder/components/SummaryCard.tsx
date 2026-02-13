import React from "react";

interface SummaryCardProps {
  label: string;
  value: string | number;
  color?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  color = "bg-blue-50",
}) => (
  <div className={`flex flex-col items-center p-4 rounded shadow-sm ${color}`}>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
      {label}
    </div>
  </div>
);

export default SummaryCard;
