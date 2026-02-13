import React from "react";

interface SortMenuProps {
  value: string;
  onChange: (value: string) => void;
  options?: { label: string; value: string }[];
}

const DEFAULT_OPTIONS = [
  { label: "Sort: MRR", value: "mrr" },
  { label: "Sort: Updated", value: "updatedAt" },
  { label: "Sort: Wins (30d)", value: "wins30d" },
];

const SortMenu: React.FC<SortMenuProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}) => {
  return (
    <select
      className="px-3 py-2 border rounded focus:outline-none focus:ring"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Sort workspaces"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default SortMenu;
