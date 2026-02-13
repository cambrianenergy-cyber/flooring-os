import React from "react";

interface IndustryFilterProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}

const DEFAULT_OPTIONS = [
  "All Industries",
  "Flooring",
  "Construction",
  "Design",
  "Retail",
  "Other",
];

const IndustryFilter: React.FC<IndustryFilterProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}) => {
  return (
    <select
      className="px-3 py-2 border rounded focus:outline-none focus:ring"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by industry"
    >
      {options.map((opt) => (
        <option key={opt} value={opt === "All Industries" ? "" : opt}>
          {opt}
        </option>
      ))}
    </select>
  );
};

export default IndustryFilter;
