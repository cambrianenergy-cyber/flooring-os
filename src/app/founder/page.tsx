"use client";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const workspaces = [
  { id: "all", name: "All Workspaces" },
  { id: "ws1", name: "Workspace 1" },
  { id: "ws2", name: "Workspace 2" },
];

const dateRanges = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "YTD", value: "ytd" },
];

export default function FounderDashboard() {
  const [view, setView] = useState<"founder" | "user">("founder");
  const [workspace, setWorkspace] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  // --- FOUNDER SNAPSHOT DATA ---
  // founderUserId is now expected from auth/session context
  const founderUserId = "demo-founder";
  const [globalSnapshot, setGlobalSnapshot] = useState<any | null>(null);
  const [workspaceSnapshots, setWorkspaceSnapshots] = useState<any[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);

  useEffect(() => {
    async function fetchSnapshots() {
      setSnapshotsLoading(true);
      // Get latest global snapshot
      const globalQ = query(
        collection(db, `founder/${founderUserId}/globalSnapshots`),
        orderBy("createdAt", "desc"),
        limit(1),
      );
      const globalSnap = await getDocs(globalQ);
      setGlobalSnapshot(globalSnap.docs[0]?.data() || null);
      // Get all workspace snapshots
      const wsQ = query(
        collection(db, `founder/${founderUserId}/workspaceSnapshots`),
        orderBy("updatedAt", "desc"),
      );
      const wsSnap = await getDocs(wsQ);
      setWorkspaceSnapshots(
        wsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
      setSnapshotsLoading(false);
    }
    fetchSnapshots();
  }, [founderUserId]);

  // Map snapshot data to KPIs
  const totalMRR = globalSnapshot?.totalMRRCents
    ? `$${(globalSnapshot.totalMRRCents / 100).toLocaleString()}`
    : "$42,000";
  const activeWorkspaces = globalSnapshot?.activeWorkspaces ?? 18;
  const activeUsers = globalSnapshot?.totalUsers ?? 124;
  const revenue30d = globalSnapshot?.totalRevenueCents
    ? `$${(globalSnapshot.totalRevenueCents / 100).toLocaleString()}`
    : "$120,000";
  const closeRate30d = globalSnapshot?.churnRatePct
    ? `${globalSnapshot.churnRatePct}%`
    : "32%";
  const agentRuns30d = globalSnapshot?.agentRuns30d
    ? `${globalSnapshot.agentRuns30d}`
    : "2,340 (2.1% fail)";

  return (
    <div className="p-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Founder/User toggle */}
        <div className="flex items-center gap-2">
          <span
            className={
              view === "founder" ? "font-bold" : "text-gray-500 cursor-pointer"
            }
            onClick={() => setView("founder")}
          >
            Founder
          </span>
          <span className="mx-1">|</span>
          <span
            className={
              view === "user" ? "font-bold" : "text-gray-500 cursor-pointer"
            }
            onClick={() => setView("user")}
          >
            User
          </span>
        </div>

        {/* Workspace filter dropdown */}
        <select
          className="border rounded px-2 py-1"
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>

        {/* Date range selector */}
        <div className="flex gap-2">
          {dateRanges.map((r) => (
            <button
              key={r.value}
              className={`px-3 py-1 rounded ${dateRange === r.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
              onClick={() => setDateRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button className="bg-blue-500 text-white px-3 py-1 rounded">
            Open Workspace
          </button>
          <button className="bg-yellow-500 text-white px-3 py-1 rounded">
            View Billing Issues
          </button>
          <button className="bg-purple-500 text-white px-3 py-1 rounded">
            View DocuSign Queue
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          {
            label: "Total MRR",
            value: totalMRR,
            route: "/founder/revenue",
          },
          {
            label: "Active Workspaces",
            value: activeWorkspaces,
            route: "/founder/workspaces",
          },
          {
            label: "Active Users",
            value: activeUsers,
            route: "/founder/workspaces",
          },
          {
            label: "30d Revenue",
            value: revenue30d,
            route: "/founder/revenue",
          },
          {
            label: "Close Rate (30d)",
            value: closeRate30d,
            route: "/founder/sales-ops",
          },
          {
            label: "Agent Runs (30d)",
            value: agentRuns30d,
            route: "/founder/agents",
          },
        ].map((card) => (
          <a
            key={card.label}
            href={card.route}
            className="block bg-white rounded shadow p-4 hover:bg-blue-50 transition cursor-pointer border border-gray-100"
          >
            <div className="text-xs text-gray-500 mb-1">{card.label}</div>
            <div className="text-2xl font-bold">{card.value}</div>
          </a>
        ))}
      </div>
      {/* Section 3: Operational Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Billing Health Panel */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-bold mb-2">Billing Health</h2>
          <ul className="mb-2">
            <li>
              Past Due: <span className="font-bold text-red-600">3</span>
            </li>
            <li>
              Canceled: <span className="font-bold text-gray-600">1</span>
            </li>
            <li>
              Trialing: <span className="font-bold text-yellow-600">2</span>
            </li>
          </ul>
          <div className="text-sm text-gray-700 mb-1 font-semibold">
            Needs Attention
          </div>
          <ul className="text-xs text-red-700">
            <li>Workspace A (Past Due)</li>
            <li>Workspace B (Trialing)</li>
            <li>Workspace C (Canceled)</li>
          </ul>
        </div>

        {/* DocuSign Health Panel */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-bold mb-2">DocuSign Health</h2>
          <ul className="mb-2">
            <li>
              Envelopes Sent (Not Signed):{" "}
              <span className="font-bold text-yellow-600">5</span>
            </li>
            <li>
              Errors/Voids: <span className="font-bold text-red-600">2</span>
            </li>
            <li>
              Stuck &gt; 7 days:{" "}
              <span className="font-bold text-red-600">1</span>
            </li>
          </ul>
          <div className="text-sm text-gray-700 mb-1 font-semibold">
            Needs Attention
          </div>
          <ul className="text-xs text-red-700">
            <li>Contract #123 (Stuck)</li>
            <li>Contract #456 (Error)</li>
          </ul>
        </div>

        {/* System Health Panel */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-bold mb-2">System Health</h2>
          <ul className="mb-2">
            <li>
              Webhook Failures (Stripe/DocuSign):{" "}
              <span className="font-bold text-red-600">2</span>
            </li>
            <li>
              Failed Jobs: <span className="font-bold text-red-600">1</span>
            </li>
            <li>Error Logs (Top 5):</li>
          </ul>
          <ul className="text-xs text-red-700">
            <li>[2026-01-22] Stripe webhook timeout</li>
            <li>[2026-01-21] DocuSign envelope error</li>
            <li>[2026-01-20] Job queue stalled</li>
            <li>[2026-01-19] API rate limit exceeded</li>
            <li>[2026-01-18] Billing sync failed</li>
          </ul>
        </div>
      </div>
      {/* Section 4: Workspaces Table */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-bold mb-4">Workspaces</h2>
        <WorkspaceTable
          workspaceSnapshots={workspaceSnapshots}
          loading={snapshotsLoading}
        />
      </div>
    </div>
  );
}

function WorkspaceTable({
  workspaceSnapshots,
  loading,
}: {
  workspaceSnapshots: any[];
  loading: boolean;
}) {
  if (loading) return <div>Loading workspaces...</div>;
  if (!workspaceSnapshots.length) return <div>No workspaces found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Workspace Name</th>
            <th className="p-2 text-left">Industry</th>
            <th className="p-2 text-left">Plan</th>
            <th className="p-2 text-left">MRR</th>
            <th className="p-2 text-left">Users</th>
            <th className="p-2 text-left">30d Est/Contracts/Signed</th>
            <th className="p-2 text-left">Health</th>
            <th className="p-2 text-left">Last Activity</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workspaceSnapshots.map((ws) => (
            <tr key={ws.workspaceId || ws.id} className="border-t">
              <td className="p-2 font-semibold">
                {ws.workspaceName || ws.workspaceId || ws.id}
              </td>
              <td className="p-2">{ws.industry || "-"}</td>
              <td className="p-2">{ws.plan || "-"}</td>
              <td className="p-2">
                {ws.mrrCents ? `$${(ws.mrrCents / 100).toLocaleString()}` : "-"}
              </td>
              <td className="p-2">{ws.userCount ?? "-"}</td>
              <td className="p-2">
                {ws.estimates30d ?? 0} / {ws.contracts30d ?? 0} /{" "}
                {ws.signed30d ?? 0}
              </td>
              <td className="p-2">
                {/* Health: green/yellow/red based on status */}
                <span
                  className={
                    ws.health === "green"
                      ? "inline-block w-3 h-3 rounded-full bg-green-500"
                      : ws.health === "yellow"
                        ? "inline-block w-3 h-3 rounded-full bg-yellow-400"
                        : "inline-block w-3 h-3 rounded-full bg-red-500"
                  }
                  title={ws.health}
                ></span>
              </td>
              <td className="p-2">
                {ws.updatedAt
                  ? new Date(
                      ws.updatedAt.seconds
                        ? ws.updatedAt.seconds * 1000
                        : ws.updatedAt,
                    ).toLocaleDateString()
                  : "-"}
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                  <a
                    href={`/founder/workspaces/${ws.workspaceId || ws.id}`}
                    className="text-blue-600 underline"
                  >
                    Open
                  </a>
                  <button className="text-gray-600 underline">
                    Impersonate
                  </button>
                  <a href="#" className="text-yellow-600 underline">
                    Billing
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
