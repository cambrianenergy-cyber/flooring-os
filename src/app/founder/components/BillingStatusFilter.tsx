import React from "react";

interface BillingStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}

const DEFAULT_OPTIONS = [
  "All Billing Statuses",
  "Active",
  "Trial",
  "Past Due",
  "Canceled",
  "No Billing",
];

const BillingStatusFilter: React.FC<BillingStatusFilterProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}) => {
  return (
    <select
      className="px-3 py-2 border rounded focus:outline-none focus:ring"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by billing status"
    >
      {options.map((opt) => (
        <option key={opt} value={opt === "All Billing Statuses" ? "" : opt}>
          {opt}
        </option>
      ))}
    </select>
  );
};

export default BillingStatusFilter;
