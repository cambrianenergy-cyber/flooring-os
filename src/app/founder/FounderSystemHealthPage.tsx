"use client";
import { useState } from "react";
import {
    useFounderIdentity,
    useFounderSystemIssues,
} from "../../hooks/founderDataHooks";
import TableSkeleton from "./components/TableSkeleton";
import { EmptyState } from "./EmptyState";

const severityOptions = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];
const statusOptions = [
  { label: "Open", value: "open" },
  { label: "Acknowledged", value: "acknowledged" },
  { label: "Resolved", value: "resolved" },
];
const typeOptions = [
  { label: "Stripe Webhook Failed", value: "stripe_webhook_failed" },
  { label: "DocuSign Webhook Failed", value: "docusign_webhook_failed" },
  { label: "Snapshot Job Failed", value: "snapshot_job_failed" },
  { label: "API Error", value: "api_error" },
  { label: "Agent Failure", value: "agent_failure" },
];

const FounderSystemHealthPage = () => {
  let uid: string | undefined = undefined;
  if (typeof window !== "undefined") {
    uid = window.localStorage.getItem("founderUserId") || undefined;
  }
  const identity = useFounderIdentity(uid);
  const founderId = identity?.founderId || "demo-founder";

  const [severity, setSeverity] = useState(["high", "medium", "low"]);
  const [status, setStatus] = useState(["open", "acknowledged", "resolved"]);
  const [type, setType] = useState("");
  const [selected, setSelected] = useState<FounderSystemIssue | null>(null);

  const issues = useFounderSystemIssues(founderId, {
    status: status.length === 3 ? undefined : status[0],
    // Removed 'type' property as it's not part of FounderSystemIssuesOptions
  }) as FounderSystemIssue[];
  const loading = !identity || !issues;

  const filtered = Array.isArray(issues)
    ? issues.filter(
        (row) =>
          typeof row.severity === "string" &&
          severity.includes(row.severity) &&
          typeof row.status === "string" &&
          status.includes(row.status) &&
          (!type || row.type === type),
      )
    : [];

  const highCount = filtered.filter((i) => i.severity === "high").length;
  const medCount = filtered.filter((i) => i.severity === "medium").length;
  const lowCount = filtered.filter((i) => i.severity === "low").length;

  if (loading)
    return (
      <div className="p-4">
        <TableSkeleton rows={8} />
      </div>
    );
  if (!filtered.length) return <EmptyState message="No system issues!" />;

  return (
    <section className="bg-white rounded shadow p-4">
      <SystemHealthHeader />
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <SeverityFilterChips value={severity} onChange={setSeverity} />
        <StatusFilterChips value={status} onChange={setStatus} />
        <TypeFilterSelect value={type} onChange={setType} />
      </div>
      <SystemHealthSummaryRow
        high={highCount}
        medium={medCount}
        low={lowCount}
      />
      <SystemIssuesTable
        issues={filtered}
        onSelect={(row) => setSelected(row)}
      />
      <IssueDetailDrawer issue={selected} onClose={() => setSelected(null)} />
    </section>
  );
};

const SystemHealthHeader = () => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
    <h1 className="text-2xl font-bold">System Health</h1>
    <div className="text-gray-500 mt-2 md:mt-0">
      Monitor and resolve system issues
    </div>
  </div>
);

const SeverityFilterChips = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) => (
  <div className="flex gap-2 flex-wrap">
    {severityOptions.map((s) => (
      <button
        key={s.value}
        className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
          value.includes(s.value)
            ? "bg-red-600 text-white border-red-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-red-50"
        }`}
        onClick={() =>
          value.includes(s.value)
            ? onChange(value.filter((v) => v !== s.value))
            : onChange([...value, s.value])
        }
        type="button"
      >
        {s.label}
      </button>
    ))}
  </div>
);

const StatusFilterChips = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) => (
  <div className="flex gap-2 flex-wrap">
    {statusOptions.map((s) => (
      <button
        key={s.value}
        className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
          value.includes(s.value)
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
        }`}
        onClick={() =>
          value.includes(s.value)
            ? onChange(value.filter((v) => v !== s.value))
            : onChange([...value, s.value])
        }
        type="button"
      >
        {s.label}
      </button>
    ))}
  </div>
);

const TypeFilterSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <select
    className="border rounded px-2 py-1 text-xs"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">All Types</option>
    {typeOptions.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const SystemHealthSummaryRow = ({
  high,
  medium,
  low,
}: {
  high: number;
  medium: number;
  low: number;
}) => (
  <div className="flex gap-4 mb-4">
    <IssueCountCard severity="high" count={high} />
    <IssueCountCard severity="medium" count={medium} />
    <IssueCountCard severity="low" count={low} />
  </div>
);

const IssueCountCard = ({
  severity,
  count,
}: {
  severity: string;
  count: number;
}) => (
  <div
    className={`flex flex-col items-center p-4 rounded shadow-sm ${severity === "high" ? "bg-red-50" : severity === "medium" ? "bg-yellow-50" : "bg-green-50"}`}
  >
    <div className="text-2xl font-bold">{count}</div>
    <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
      {severity} severity
    </div>
  </div>
);

// TODO: Update the import path below to the correct location of FounderSystemIssue type.
// import type { FounderSystemIssue } from "../../../types/founderSystemIssue";

// Temporary fix: Define the type inline if the type file is missing.
type FounderSystemIssue = {
  id: string;
  severity: string;
  type: string;
  workspaceName?: string;
  workspaceId?: string;
  occurrences: number;
  lastSeenAt?: { seconds: number };
  status: string;
};

const SystemIssuesTable = ({
  issues,
  onSelect,
}: {
  issues: FounderSystemIssue[];
  onSelect: (row: FounderSystemIssue) => void;
}) => (
  <table className="min-w-full bg-white border rounded">
    <thead>
      <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
        <th className="px-4 py-2">Severity</th>
        <th className="px-4 py-2">Type</th>
        <th className="px-4 py-2">Workspace</th>
        <th className="px-4 py-2">Occurrences</th>
        <th className="px-4 py-2">Last Seen</th>
        <th className="px-4 py-2">Status</th>
        <th className="px-4 py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {issues.map((row) => (
        <tr key={row.id} className="border-b hover:bg-gray-50">
          <td className="px-4 py-2 capitalize">{row.severity}</td>
          <td className="px-4 py-2">{row.type}</td>
          <td className="px-4 py-2">{row.workspaceName || row.workspaceId}</td>
          <td className="px-4 py-2">{row.occurrences}</td>
          <td className="px-4 py-2">
            {row.lastSeenAt
              ? new Date(row.lastSeenAt.seconds * 1000).toLocaleString()
              : "-"}
          </td>
          <td className="px-4 py-2 capitalize">{row.status}</td>
          <td className="px-4 py-2">
            <button
              className="btn btn-xs btn-primary mr-1"
              onClick={() => onSelect(row)}
            >
              Acknowledge
            </button>
            <button className="btn btn-xs btn-secondary">Resolve</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

import IssueDetailDrawer from "./components/IssueDetailDrawer";

export default FounderSystemHealthPage;
