import React from "react";

interface HealthFilterProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}

const DEFAULT_OPTIONS = [
  "All Health Statuses",
  "Healthy",
  "Warning",
  "Critical",
];

const HealthFilter: React.FC<HealthFilterProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}) => {
  return (
    <select
      className="px-3 py-2 border rounded focus:outline-none focus:ring"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by health status"
    >
      {options.map((opt) => (
        <option key={opt} value={opt === "All Health Statuses" ? "" : opt}>
          {opt}
        </option>
      ))}
    </select>
  );
};

export default HealthFilter;
