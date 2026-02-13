import React from "react";

interface BillingStatusBadgeProps {
  value?: string;
}

const colorMap: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  past_due: "bg-yellow-100 text-yellow-800 border-yellow-300",
  unpaid: "bg-red-100 text-red-800 border-red-300",
  canceled: "bg-gray-100 text-gray-600 border-gray-300",
};

const labelMap: Record<string, string> = {
  active: "Active",
  past_due: "Past Due",
  unpaid: "Unpaid",
  canceled: "Canceled",
};

const BillingStatusBadge: React.FC<BillingStatusBadgeProps> = ({ value }) => {
  if (!value) return null;
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

export default BillingStatusBadge;
