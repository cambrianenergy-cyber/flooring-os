import { useFounderSystemIssues } from "@/hooks/founderDataHooks";
import React from "react";

type SystemIssue = {
  id: string | number;
  severity?: string;
  description?: string;
  reason?: string;
  [key: string]: unknown;
};

export function SystemHealthSummaryBar({ issues }: { issues: SystemIssue[] }) {
  // Count by severity (e.g., 'critical', 'high', 'medium', 'low', etc.)
  const counts = issues.reduce(
    (acc, issue) => {
      const severity = issue.severity || "unknown";
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  return (
    <div className="flex gap-4 mb-2">
      {Object.entries(counts).map(([severity, count]) => (
        <div key={severity} className="flex flex-col items-center">
          <span className="font-bold text-sm">{String(count)}</span>
          <span className="text-xs text-gray-500">{severity}</span>
        </div>
      ))}
    </div>
  );
}

export function SystemIssuesMiniList({ issues }: { issues: SystemIssue[] }) {
  if (!issues.length)
    return <div className="text-xs text-gray-400">No open system issues.</div>;
  return (
    <ul className="text-xs list-disc ml-5">
      {issues.map((issue) => (
        <li key={issue.id} className="mb-1">
          {issue.description || issue.reason || JSON.stringify(issue)}
        </li>
      ))}
    </ul>
  );
}

export function PanelFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="block mt-2 text-blue-600 underline text-xs">
      {children}
    </a>
  );
}

export function PanelSkeleton() {
  return (
    <div className="bg-white rounded shadow p-4 mb-4 animate-pulse h-32" />
  );
}

export function SystemHealthPanel({ founderId }: { founderId: string }) {
  const issues = useFounderSystemIssues(founderId, {
    limitNum: 10,
    status: "open",
  });
  if (!issues)
    return (
      <>
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
      </>
    );
  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="font-semibold mb-2">System Health</div>
      <SystemHealthSummaryBar issues={issues} />
      <SystemIssuesMiniList issues={issues} />
      <PanelFooterLink href="/founder/system">
        View all system issues
      </PanelFooterLink>
    </div>
  );
}
