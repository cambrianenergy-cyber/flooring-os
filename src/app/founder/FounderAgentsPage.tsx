import { useState } from "react";
import {
  useFounderIdentity,
  useFounderMetricsDaily,
  useFounderSystemIssues,
} from "../../hooks/founderDataHooks";
import AgentIssueDetailDrawer from "./components/AgentIssueDetailDrawer";
import DataTable, { DataTableColumn } from "./components/DataTable";
import RowActionsMenu from "./components/RowActionsMenu";
import TableSkeleton from "./components/TableSkeleton";

// Types
import type { FounderSystemIssue } from "../../../types/founderSystemIssue";

type Metric = {
  id: string;
  agentRuns?: number;
  agentFailures?: number;
};

const FounderAgentsPage = () => {
  let uid: string | undefined = undefined;
  if (typeof window !== "undefined") {
    uid = window.localStorage.getItem("founderUserId") || undefined;
  }
  const identity = useFounderIdentity(uid);
  const founderId = identity?.founderId || "demo-founder";

  const [dateRange, setDateRange] = useState(30);
  const metrics = useFounderMetricsDaily(founderId, dateRange) as Metric[];
  const systemIssues = useFounderSystemIssues(founderId, {
    status: "open",
  }) as FounderSystemIssue[];
  const loading = !identity || !metrics || !systemIssues;

  // Summary
  const totalRuns = Array.isArray(metrics)
    ? metrics.reduce(
        (sum, m) => sum + (typeof m.agentRuns === "number" ? m.agentRuns : 0),
        0,
      )
    : 0;
  const failures = Array.isArray(metrics)
    ? metrics.reduce(
        (sum, m) =>
          sum + (typeof m.agentFailures === "number" ? m.agentFailures : 0),
        0,
      )
    : 0;
  const failureRate = totalRuns
    ? ((failures / totalRuns) * 100).toFixed(1)
    : "0.0";

  // Top failing workspaces (from systemIssues type=agent_failure)
  const topFailing = Array.isArray(systemIssues)
    ? systemIssues
        .filter((i) => i.type === "agent_failure")
        .sort(
          (a, b) =>
            (typeof b.occurrences === "number" ? b.occurrences : 0) -
            (typeof a.occurrences === "number" ? a.occurrences : 0),
        )
        .slice(0, 5)
    : [];
  const [selected, setSelected] = useState<FounderSystemIssue | null>(null);

  if (loading)
    return (
      <div className="p-4">
        <TableSkeleton rows={8} />
      </div>
    );

  return (
    <section className="bg-white rounded shadow p-4">
      <AgentsHeader dateRange={dateRange} setDateRange={setDateRange} />
      <AgentsSummaryCards
        totalRuns={totalRuns}
        failures={failures}
        failureRate={failureRate}
      />
      <AgentRunsTrendChart metrics={metrics} />
      <TopFailingWorkspacesPanel workspaces={topFailing} />
      <DataTable
        columns={agentFailureColumns(setSelected)}
        data={topFailing}
        rowKey={(row) => row.issueId ?? row.id ?? ""}
        emptyMessage="No agent failures"
      />
      <AgentIssueDetailDrawer
        issue={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
};

const AgentsHeader = ({
  dateRange,
  setDateRange,
}: {
  dateRange: number;
  setDateRange: (n: number) => void;
}) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
    <h1 className="text-2xl font-bold">Agent Activity</h1>
    <div className="flex items-center gap-2 mt-2 md:mt-0">
      <span className="text-xs text-gray-500">Date Range:</span>
      <select
        className="border rounded px-2 py-1 text-xs"
        value={dateRange}
        onChange={(e) => setDateRange(Number(e.target.value))}
      >
        <option value={7}>7d</option>
        <option value={14}>14d</option>
        <option value={30}>30d</option>
      </select>
    </div>
  </div>
);

const AgentsSummaryCards = ({
  totalRuns,
  failures,
  failureRate,
}: {
  totalRuns: number;
  failures: number;
  failureRate: string;
}) => (
  <div className="grid grid-cols-3 gap-4 mb-4">
    <SummaryCard
      label="Total Runs (30d)"
      value={totalRuns}
      color="bg-blue-50"
    />
    <SummaryCard label="Failures (30d)" value={failures} color="bg-red-50" />
    <SummaryCard
      label="Failure Rate"
      value={`${failureRate}%`}
      color="bg-yellow-50"
    />
  </div>
);

import SummaryCard from "./components/SummaryCard";

const AgentRunsTrendChart = ({ metrics }: { metrics: Metric[] }) => {
  if (!metrics.length) return null;
  const max = Math.max(
    ...metrics.map((m) => (typeof m.agentRuns === "number" ? m.agentRuns : 0)),
  );
  const width = 300;
  const height = 60;
  const points = metrics
    .map((m, i) => {
      const x = (i / (metrics.length - 1)) * width;
      const y =
        height -
        ((typeof m.agentRuns === "number" ? m.agentRuns : 0) / (max || 1)) *
          height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-1">
        Agent Runs Trend (last {metrics.length} days)
      </div>
      <svg width={width} height={height} className="bg-gray-50 rounded">
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          points={points}
        />
      </svg>
    </div>
  );
};

const TopFailingWorkspacesPanel = ({
  workspaces,
}: {
  workspaces: FounderSystemIssue[];
}) => (
  <div className="mb-4">
    <div className="font-semibold mb-2">Top Failing Workspaces</div>
    {workspaces.length === 0 ? (
      <div className="text-xs text-gray-400">No agent failures</div>
    ) : (
      <ul className="text-xs">
        {workspaces.map((w) => (
          <li key={w.issueId || w.id} className="border-b last:border-b-0 py-1">
            <span className="font-medium">
              {w.workspaceName || w.workspaceId}:
            </span>{" "}
            {w.occurrences} failures
          </li>
        ))}
      </ul>
    )}
  </div>
);

function agentFailureColumns(
  onSelect: (row: FounderSystemIssue) => void,
): DataTableColumn<FounderSystemIssue>[] {
  return [
    {
      key: "workspace",
      label: "Workspace", // Sorting logic can be added
      render: (row) => row.workspaceName || row.workspaceId,
    },
    {
      key: "occurrences",
      label: "Occurrences", // Sorting logic can be added
      render: (row) => row.occurrences,
    },
    {
      key: "lastSeenAt",
      label: "Last Seen", // Sorting logic can be added
      render: (row) =>
        row.lastSeenAt
          ? new Date(row.lastSeenAt.seconds * 1000).toLocaleString()
          : "-",
    },
    {
      key: "message",
      label: "Message",
      render: (row) => <span className="text-xs">{row.message}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <RowActionsMenu
          actions={[
            {
              label: "View Details",
              onClick: () => onSelect(row),
            },
          ]}
        />
      ),
      className: "px-2 py-2 text-right",
    },
  ];
}

export default FounderAgentsPage;
