import React from "react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage,
}: DataTableProps<T>) {
  return (
    <table className="min-w-full bg-white border rounded">
      <thead>
        <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
          {columns.map((col) => (
            <th key={col.key} className={col.className || "px-4 py-2"}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="text-center text-xs text-gray-400 py-4"
            >
              {emptyMessage || "No data found"}
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr
              key={rowKey(row)}
              className={
                onRowClick
                  ? "border-b hover:bg-gray-50 cursor-pointer"
                  : "border-b"
              }
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.className || "px-4 py-2"}>
                  {col.render
                    ? col.render(row)
                    : (row[col.key as keyof T] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default DataTable;
