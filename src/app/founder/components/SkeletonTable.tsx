import React from "react";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = "",
}) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          {[...Array(columns)].map((_, i) => (
            <th key={i} className="px-4 py-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(rows)].map((_, rowIdx) => (
          <tr key={rowIdx}>
            {[...Array(columns)].map((_, colIdx) => (
              <td key={colIdx} className="px-4 py-3">
                <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SkeletonTable;
