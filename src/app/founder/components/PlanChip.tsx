import React from "react";

interface PlanChipProps {
  plan: string;
}

const PLAN_STYLES: Record<string, string> = {
  Free: "bg-gray-100 text-gray-700 border-gray-300",
  Starter: "bg-blue-100 text-blue-800 border-blue-300",
  Pro: "bg-purple-100 text-purple-800 border-purple-300",
  Enterprise: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

const PlanChip: React.FC<PlanChipProps> = ({ plan }) => {
  const style =
    PLAN_STYLES[plan] || "bg-gray-100 text-gray-600 border-gray-300";
  return (
    <span className={`inline-block px-2 py-1 text-xs rounded border ${style}`}>
      {plan || "-"}
    </span>
  );
};

export default PlanChip;
