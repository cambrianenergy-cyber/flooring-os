import React from "react";

interface WorkspaceKpiRowProps {
  snapshot: {
    mrrCents?: number;
    activeUsers?: number;
    estimates30d?: number;
    contracts30d?: number;
    signed30d?: number;
    lastActivityAt?: string | number | { seconds: number };
  };
}

const formatDate = (
  date: string | number | { seconds: number } | undefined,
) => {
  if (!date) return "-";
  if (typeof date === "object" && date !== null && "seconds" in date) {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }
  if (typeof date === "number") {
    return new Date(date).toLocaleDateString();
  }
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString();
  }
  return "-";
};

const WorkspaceKpiRow: React.FC<WorkspaceKpiRowProps> = ({ snapshot }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="bg-white rounded shadow p-4 min-w-[120px] text-center">
        <div className="text-xs text-gray-500">MRR</div>
        <div className="text-lg font-bold">
          {typeof snapshot.mrrCents === "number"
            ? `$${(snapshot.mrrCents / 100).toLocaleString()}`
            : "-"}
        </div>
      </div>
      <div className="bg-white rounded shadow p-4 min-w-[120px] text-center">
        <div className="text-xs text-gray-500">Active Users</div>
        <div className="text-lg font-bold">{snapshot.activeUsers ?? "-"}</div>
      </div>
      <div className="bg-white rounded shadow p-4 min-w-[120px] text-center">
        <div className="text-xs text-gray-500">30d Estimates</div>
        <div className="text-lg font-bold">{snapshot.estimates30d ?? "-"}</div>
      </div>
      <div className="bg-white rounded shadow p-4 min-w-[120px] text-center">
        <div className="text-xs text-gray-500">30d Contracts</div>
        <div className="text-lg font-bold">{snapshot.contracts30d ?? "-"}</div>
      </div>
      <div className="bg-white rounded shadow p-4 min-w-[120px] text-center">
        <div className="text-xs text-gray-500">30d Signed</div>
        <div className="text-lg font-bold">{snapshot.signed30d ?? "-"}</div>
      </div>
      <div className="bg-white rounded shadow p-4 min-w-[120px] text-center">
        <div className="text-xs text-gray-500">Last Activity</div>
        <div className="text-lg font-bold">
          {formatDate(snapshot.lastActivityAt)}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceKpiRow;
