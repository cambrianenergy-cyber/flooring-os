import React from "react";

const TABS = [
  { label: "Carpet" },
  { label: "Laminate" },
  { label: "Tile" },
  { label: "LVP" },
  { label: "Hardwood" },
  { label: "Engineered" },
];

export default function ProductTabs({ active, onSelect }: { active: string; onSelect: (tab: string) => void }) {
  return (
    <div className="flex gap-2 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.label}
          className={`px-4 py-2 rounded-full font-semibold border transition-all shadow-sm
            ${active === tab.label ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"}
          `}
          onClick={() => onSelect(tab.label)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
