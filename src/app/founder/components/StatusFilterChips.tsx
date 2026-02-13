import React from "react";

const statuses = [
  { label: "Past Due", value: "past_due" },
  { label: "Canceled", value: "canceled" },
  { label: "Active", value: "active" },
  { label: "Trialing", value: "trialing" },
];

interface StatusFilterChipsProps {
  value: string[];
  onChange: (values: string[]) => void;
}

const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({
  value,
  onChange,
}) => {
  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };
  return (
    <div className="flex gap-2 flex-wrap">
      {statuses.map((s) => (
        <button
          key={s.value}
          className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
            value.includes(s.value)
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
          }`}
          onClick={() => toggle(s.value)}
          type="button"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

export default StatusFilterChips;
