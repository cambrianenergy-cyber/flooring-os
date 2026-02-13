import React from "react";

interface TableSkeletonProps {
  rows?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 10 }) => {
  return (
    <table className="min-w-full bg-white border rounded animate-pulse">
      <thead>
        <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Industry</th>
          <th className="px-4 py-2">Health</th>
          <th className="px-4 py-2">Plan</th>
          <th className="px-4 py-2">Billing</th>
          <th className="px-4 py-2">MRR</th>
          <th className="px-4 py-2">Wins (30d)</th>
          <th className="px-4 py-2">Updated</th>
          <th className="px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b">
            {Array.from({ length: 9 }).map((_, j) => (
              <td key={j} className="px-4 py-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableSkeleton;
