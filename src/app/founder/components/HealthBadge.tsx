import React from "react";

interface HealthBadgeProps {
  health: string;
}

const HEALTH_STYLES: Record<string, string> = {
  Healthy: "bg-green-100 text-green-800 border-green-300",
  Warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Critical: "bg-red-100 text-red-800 border-red-300",
};

const HealthBadge: React.FC<HealthBadgeProps> = ({ health }) => {
  const style =
    HEALTH_STYLES[health] || "bg-gray-100 text-gray-600 border-gray-300";
  return (
    <span className={`inline-block px-2 py-1 text-xs rounded border ${style}`}>
      {health || "-"}
    </span>
  );
};

export default HealthBadge;
