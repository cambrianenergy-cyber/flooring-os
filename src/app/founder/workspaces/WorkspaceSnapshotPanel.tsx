import React from "react";

interface WorkspaceSnapshotPanelProps {
  snapshot: Record<string, any>;
  metricsDaily?: Array<Record<string, any>>;
}

const WorkspaceSnapshotPanel: React.FC<WorkspaceSnapshotPanelProps> = ({
  snapshot,
  metricsDaily,
}) => {
  return (
    <div className="mb-6">
      {/* Key-Value Grid */}
      <SnapshotKeyValueGrid snapshot={snapshot} />
      {/* Trend Mini Chart (optional) */}
      {metricsDaily && metricsDaily.length > 0 && (
        <div className="mt-4">
          <TrendMiniChart data={metricsDaily} />
        </div>
      )}
    </div>
  );
};

// Placeholder for SnapshotKeyValueGrid
const SnapshotKeyValueGrid: React.FC<{ snapshot: Record<string, any> }> = ({
  snapshot,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
    {Object.entries(snapshot).map(([key, value]) => (
      <div key={key} className="flex flex-col">
        <span className="text-xs text-gray-500">{key}</span>
        <span className="font-mono text-sm">{String(value)}</span>
      </div>
    ))}
  </div>
);

// Placeholder for TrendMiniChart
const TrendMiniChart: React.FC<{ data: Array<Record<string, any>> }> = ({
  data,
}) => (
  <div className="h-16 bg-gradient-to-r from-blue-100 to-blue-300 rounded flex items-center justify-center text-xs text-blue-700">
    Trend Mini Chart (coming soon)
  </div>
);

export default WorkspaceSnapshotPanel;
