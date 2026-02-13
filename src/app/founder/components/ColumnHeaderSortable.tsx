import React from "react";

interface ColumnHeaderSortableProps {
  label: string;
  sorted?: boolean;
  direction?: "asc" | "desc";
  onSort?: () => void;
  className?: string;
}

const ColumnHeaderSortable: React.FC<ColumnHeaderSortableProps> = ({
  label,
  sorted,
  direction,
  onSort,
  className = "px-4 py-2 cursor-pointer select-none",
}) => {
  // Map direction to valid aria-sort values
  let ariaSort: "ascending" | "descending" | undefined = undefined;
  if (sorted) {
    if (direction === "asc") ariaSort = "ascending";
    else if (direction === "desc") ariaSort = "descending";
  }
  return (
    <th
      className={className + (onSort ? " hover:bg-gray-100" : "")}
      onClick={onSort}
      aria-sort={ariaSort}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sorted && (
          <span className="text-xs">{direction === "asc" ? "▲" : "▼"}</span>
        )}
      </span>
    </th>
  );
};

export default ColumnHeaderSortable;
