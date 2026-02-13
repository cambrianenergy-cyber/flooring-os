"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Skeleton component moved outside render to avoid recreation on each render
type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
};
const Skeleton = ({
  width = "100%",
  height = 24,
  className = "",
}: SkeletonProps) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    style={{ width, height, minHeight: height }}
  />
);

// --- Client-only hooks (fast, safe) ---

// Reads latest global founder snapshot

// Reads workspace snapshot list (optionally filtered)

// Reads billingIssues + docusignQueue + systemIssues
import dynamic from "next/dynamic";
const FounderAgentsPage = dynamic(() => import("../FounderAgentsPage"), {
  ssr: false,
});

export default function AgentsPage() {
  return <FounderAgentsPage />;
}

// --- Server endpoints (recommended) ---
// Even with snapshots, some views should be server-gated:
//
// POST /api/founder/snapshot/rebuild (founder-only) → manual refresh
// GET  /api/founder/workspaces/export → CSV export
// POST /api/founder/impersonate → sets server session context (optional)
// Workspace impersonation context

type SystemIssue = {
  id: string;
  type: string; // webhook_failure, job_failure, repeated_error, etc.
  description?: string;
  workspaceId?: string;
  workspaceName?: string;
  createdAt?: { seconds: number } | number;
  count?: number;
};

type AgentStat = {
  id: string;
  date?: string;
  agentRuns?: number;
  agentFailures?: number;
  agentCostCents?: number;
};

type TopFailingAgent = {
  id: string;
  agentName?: string;
  workspaceName?: string;
  workspaceId?: string;
  failures?: number;
  count?: number;
  updatedAt?: { seconds: number } | number;
  createdAt?: { seconds: number } | number;
  description?: string;
};

export function FounderAgents() {
  // Workspace impersonation state (founder only)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    typeof window !== "undefined"
      ? window.localStorage.getItem("activeWorkspaceId") || null
      : null,
  );
  // Persist impersonation selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (activeWorkspaceId) {
        window.localStorage.setItem("activeWorkspaceId", activeWorkspaceId);
      } else {
        window.localStorage.removeItem("activeWorkspaceId");
      }
    }
  }, [activeWorkspaceId]);

  // System Health Panel state
  const { isFounderUser, ready, user } = useFounderAuth();
  const founderUserId = user?.uid;
  if (!founderUserId) return <div>Missing founderUserId in context</div>;

  // --- Aggregated daily agent run stats ---
  const [agentStats, setAgentStats] = useState<AgentStat[]>([]);
  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchAgentStats() {
      const q = query(
        collection(db, `founder/${founderUserId}/metricsDaily`),
        orderBy("date", "desc"),
        limit(30),
      );
      const snap = await getDocs(q);
      setAgentStats(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AgentStat),
      );
    }
    fetchAgentStats();
  }, [ready, isFounderUser, founderUserId]);

  // --- Top failing agents ---
  const [topFailingAgents, setTopFailingAgents] = useState<TopFailingAgent[]>(
    [],
  );
  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchTopFailingAgents() {
      // Try agentIssues first, fallback to systemIssues
      let docs: TopFailingAgent[] = [];
      try {
        const q = query(
          collection(db, `founder/${founderUserId}/agentIssues`),
          orderBy("failures", "desc"),
          limit(10),
        );
        const snap = await getDocs(q);
        docs = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as TopFailingAgent,
        );
      } catch {
        // fallback to systemIssues
        const q = query(
          collection(db, `founder/${founderUserId}/systemIssues`),
          where("type", "==", "agent_failure"),
          orderBy("count", "desc"),
          limit(10),
        );
        const snap = await getDocs(q);
        docs = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as TopFailingAgent,
        );
      }
      setTopFailingAgents(docs);
    }
    fetchTopFailingAgents();
  }, [ready, isFounderUser, founderUserId]);

  // Fetch all workspaces for dropdown (founder only)
  const [workspaces, setWorkspaces] = useState<
    Array<{ id: string; name: string }>
  >([]);
  useEffect(() => {
    if (!isFounderUser || !ready) return;
    async function fetchWorkspaces() {
      const q = query(collection(db, `founder/${founderUserId}/workspaces`));
      const snap = await getDocs(q);
      setWorkspaces(
        snap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
        })),
      );
    }
    fetchWorkspaces();
  }, [isFounderUser, ready, founderUserId]);
  const router = useRouter();
  // Founder ↔ User toggle state
  const searchParams = useSearchParams();
  const initialView =
    (typeof window !== "undefined" &&
      window.localStorage.getItem("viewMode")) ||
    searchParams?.get("view") ||
    "founder";

  const [viewMode, setViewMode] = useState<"founder" | "user">(
    initialView === "user" ? "user" : "founder",
  );

  // Handle routing on toggle
  const handleToggle = (mode: "founder" | "user") => {
    setViewMode(mode);
    if (mode === "user") {
      router.push("/app");
    } else if (mode === "founder") {
      router.push("/founder");
    }
  };

  // Sync viewMode to URL and localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("viewMode", viewMode);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") !== viewMode) {
      params.set("view", viewMode);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [viewMode]);
  const [systemIssues, setSystemIssues] = useState<SystemIssue[]>([]);

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchSystemIssues() {
      const q = query(collection(db, `founder/${founderUserId}/systemIssues`));
      const snap = await getDocs(q);
      setSystemIssues(
        snap.docs.map((doc) => {
          const data = doc.data();
          // Ensure severityRank is always present (server-written)
          return {
            id: doc.id,
            type: data.type ?? "",
            description: data.description,
            workspaceId: data.workspaceId,
            workspaceName: data.workspaceName,
            createdAt: data.createdAt,
            count: data.count,
            severityRank: data.severityRank ?? 0, // fallback if missing
          };
        }),
      );
    }
    fetchSystemIssues();
  }, [ready, isFounderUser, founderUserId]);

  // DocuSign Health Panel state
  type DocusignQueue = {
    id: string;
    workspaceId: string;
    workspaceName?: string;
    contractId: string;
    status: string;
    sentAt?: { seconds: number } | number;
    stuckDays?: number;
    error?: string;
  };
  const [docusignQueue, setDocusignQueue] = useState<DocusignQueue[]>([]);

  type Metrics = {
    id: string;
    date?: string;
    agentRuns?: number;
    agentFailures?: number;
    agentCostCents?: number;
    estimates30d?: number;
    contracts30d?: number;
    wins30d?: number;
  };
  type BillingIssue = {
    id: string;
    workspaceId: string;
    workspaceName?: string;
    status: string;
    planId?: string;
    amountDueCents?: number;
    updatedAt?: { seconds: number } | number;
  };
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingIssues, setBillingIssues] = useState<BillingIssue[]>([]);

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchDocusignQueue() {
      const q = query(collection(db, `founder/${founderUserId}/docusignQueue`));
      const snap = await getDocs(q);
      setDocusignQueue(
        snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            workspaceId: data.workspaceId ?? "",
            workspaceName: data.workspaceName,
            contractId: data.contractId ?? "",
            status: data.status ?? "",
            sentAt: data.sentAt,
            stuckDays: data.stuckDays,
            error: data.error,
          };
        }),
      );
    }
    fetchDocusignQueue();
  }, [ready, isFounderUser, founderUserId]);

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchBillingIssues() {
      const q = query(collection(db, `founder/${founderUserId}/billingIssues`));
      const snap = await getDocs(q);
      setBillingIssues(
        snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            workspaceId: data.workspaceId ?? "",
            status: data.status ?? "",
            workspaceName: data.workspaceName,
            planId: data.planId,
            amountDueCents: data.amountDueCents,
            updatedAt: data.updatedAt,
          };
        }),
      );
    }
    fetchBillingIssues();
  }, [ready, isFounderUser, founderUserId]);

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchMetrics() {
      setLoading(true);
      const q = query(
        collection(db, `founder/${founderUserId}/metricsDaily`),
        orderBy("date", "asc"),
      );
      const snap = await getDocs(q);
      setMetrics(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchMetrics();
  }, [ready, isFounderUser, founderUserId]);

  // Optionally, restrict user view if not implemented

  // Skeleton UI for loading states
  // (Removed duplicate Skeleton component, using the top-level Skeleton instead)

  if (!ready)
    return (
      <div className="space-y-4">
        <Skeleton width="40%" height={32} />
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={120} />
      </div>
    );
  if (!isFounderUser && viewMode === "founder")
    return <div>Access denied.</div>;
  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton width="40%" height={32} />
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={120} />
      </div>
    );

  const latest = metrics[metrics.length - 1] || {};
  const agentRuns = latest.agentRuns ?? "-";
  const agentFailures = latest.agentFailures ?? "-";
  const agentCost =
    typeof latest.agentCostCents === "number"
      ? `$${(latest.agentCostCents / 100).toLocaleString()}`
      : "-";
  const estimates = latest.estimates30d ?? null;
  const contracts = latest.contracts30d ?? null;
  const wins = latest.wins30d ?? null;
  let contractsPerEstimates = "-";
  let winsPerContracts = "-";
  if (
    typeof estimates === "number" &&
    typeof contracts === "number" &&
    estimates > 0
  ) {
    contractsPerEstimates = `${((contracts / estimates) * 100).toFixed(1)}%`;
  }
  if (
    typeof contracts === "number" &&
    typeof wins === "number" &&
    contracts > 0
  ) {
    winsPerContracts = `${((wins / contracts) * 100).toFixed(1)}%`;
  }

  // (duplicate hooks and founderUserId removed)

  return (
    <div>
      {/* Founder ↔ User Toggle */}
      {/* Only show toggle and impersonate dropdown if user is a founder */}
      {isFounderUser && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <span
              className={
                viewMode === "founder"
                  ? "font-bold text-blue-700 cursor-pointer"
                  : "text-gray-500 cursor-pointer"
              }
              onClick={() => handleToggle("founder")}
            >
              Founder
            </span>
            <span className="mx-1">|</span>
            <span
              className={
                viewMode === "user"
                  ? "font-bold text-blue-700 cursor-pointer"
                  : "text-gray-500 cursor-pointer"
              }
              onClick={() => handleToggle("user")}
            >
              User
            </span>
          </div>
          {/* Founder Admin Tool: Impersonate Workspace */}
          <div className="mb-4">
            <label
              htmlFor="impersonate-workspace"
              className="font-semibold mr-2"
            >
              Impersonate Workspace:
            </label>
            <select
              id="impersonate-workspace"
              className="border rounded px-2 py-1"
              value={activeWorkspaceId || ""}
              onChange={(e) => setActiveWorkspaceId(e.target.value || null)}
            >
              <option value="">-- None --</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
            {activeWorkspaceId && (
              <button
                className="ml-2 px-2 py-1 bg-gray-200 rounded"
                onClick={() => setActiveWorkspaceId(null)}
              >
                Clear
              </button>
            )}
          </div>
          {/* Show Return to Founder View button if in user view and founder */}
          {viewMode === "user" && (
            <button
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => handleToggle("founder")}
            >
              Return to Founder View
            </button>
          )}
        </>
      )}

      <h1 className="text-2xl font-bold mb-4">Agents</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Example: Agent Runs KPI */}
        <Link href="#agent-trend" className="block">
          <div className="bg-white rounded shadow p-4 hover:shadow-lg transition cursor-pointer">
            <div className="text-sm text-gray-500 mb-1">Agent Runs (30d)</div>
            <div className="text-2xl font-bold mb-1">
              {agentStats[0]?.agentRuns ?? (
                <Skeleton width="60px" height={32} />
              )}
            </div>
            <div className="flex items-center text-sm">
              {/* Trend: compare last 2 periods */}
              {agentStats.length > 1 ? (
                (() => {
                  const diff =
                    (agentStats[0].agentRuns ?? 0) -
                    (agentStats[1].agentRuns ?? 0);
                  const up = diff > 0;
                  return (
                    <span className={up ? "text-green-600" : "text-red-600"}>
                      {up ? "▲" : "▼"} {Math.abs(diff)} vs prev
                    </span>
                  );
                })()
              ) : (
                <Skeleton width="40px" height={16} />
              )}
            </div>
          </div>
        </Link>
        {/* Example: Agent Failures KPI */}
        <Link href="#agent-trend" className="block">
          <div className="bg-white rounded shadow p-4 hover:shadow-lg transition cursor-pointer">
            <div className="text-sm text-gray-500 mb-1">
              Agent Failures (30d)
            </div>
            <div className="text-2xl font-bold mb-1">
              {agentStats[0]?.agentFailures ?? (
                <Skeleton width="60px" height={32} />
              )}
            </div>
            <div className="flex items-center text-sm">
              {agentStats.length > 1 ? (
                (() => {
                  const diff =
                    (agentStats[0].agentFailures ?? 0) -
                    (agentStats[1].agentFailures ?? 0);
                  const up = diff < 0;
                  return (
                    <span className={up ? "text-green-600" : "text-red-600"}>
                      {up ? "▼" : "▲"} {Math.abs(diff)} vs prev
                    </span>
                  );
                })()
              ) : (
                <Skeleton width="40px" height={16} />
              )}
            </div>
          </div>
        </Link>
        {/* Example: Agent Cost KPI */}
        <Link href="#agent-trend" className="block">
          <div className="bg-white rounded shadow p-4 hover:shadow-lg transition cursor-pointer">
            <div className="text-sm text-gray-500 mb-1">Agent Cost (30d)</div>
            <div className="text-2xl font-bold mb-1">
              {typeof agentStats[0]?.agentCostCents === "number" ? (
                `$${(agentStats[0].agentCostCents / 100).toLocaleString()}`
              ) : (
                <Skeleton width="60px" height={32} />
              )}
            </div>
            <div className="flex items-center text-sm">
              {agentStats.length > 1 ? (
                (() => {
                  const diff =
                    (agentStats[0].agentCostCents ?? 0) -
                    (agentStats[1].agentCostCents ?? 0);
                  const up = diff < 0;
                  return (
                    <span className={up ? "text-green-600" : "text-red-600"}>
                      {up ? "▼" : "▲"} ${Math.abs(diff / 100).toLocaleString()}{" "}
                      vs prev
                    </span>
                  );
                })()
              ) : (
                <Skeleton width="40px" height={16} />
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Aggregated Daily Agent Run Stats */}
      <div className="mb-6" id="agent-trend">
        <h2 className="text-lg font-semibold mb-2">
          Agent Run Stats (Last 30 Days)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border sticky-header">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Agent Runs</th>
                <th className="p-2 text-left">Agent Failures</th>
                <th className="p-2 text-left">Agent Cost</th>
              </tr>
            </thead>
            <tbody>
              {agentStats.map((stat) => (
                <tr key={stat.id} className="border-t">
                  <td className="p-2">{stat.date || "-"}</td>
                  <td className="p-2">{stat.agentRuns ?? "-"}</td>
                  <td className="p-2">{stat.agentFailures ?? "-"}</td>
                  <td className="p-2">
                    {typeof stat.agentCostCents === "number"
                      ? `$${(stat.agentCostCents / 100).toLocaleString()}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <span className="px-3 py-1 bg-gray-200 rounded cursor-pointer hover:bg-blue-100">
          Past due
        </span>
        <span className="px-3 py-1 bg-gray-200 rounded cursor-pointer hover:bg-blue-100">
          DocuSign stuck
        </span>
        <span className="px-3 py-1 bg-gray-200 rounded cursor-pointer hover:bg-blue-100">
          No activity
        </span>
        <span className="px-3 py-1 bg-gray-200 rounded cursor-pointer hover:bg-blue-100">
          High revenue
        </span>
      </div>

      {/* Top Failing Agents */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Top Failing Agents</h2>
        {topFailingAgents.length === 0 ? (
          <div className="text-green-700">No agent failures detected.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="p-2 text-left">Agent</th>
                  <th className="p-2 text-left">Workspace</th>
                  <th className="p-2 text-left">Failures</th>
                  <th className="p-2 text-left">Last Failure</th>
                  <th className="p-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {topFailingAgents.map((agent) => (
                  <tr key={agent.id} className="border-t">
                    <td className="p-2">
                      {agent.agentName || agent.id || "-"}
                    </td>
                    <td className="p-2">
                      {agent.workspaceName || agent.workspaceId || "-"}
                    </td>
                    <td className="p-2">
                      {agent.failures ?? agent.count ?? "-"}
                    </td>
                    <td className="p-2">
                      {agent.updatedAt
                        ? typeof agent.updatedAt === "number"
                          ? new Date(
                              agent.updatedAt * 1000,
                            ).toLocaleDateString()
                          : agent.updatedAt.seconds
                            ? new Date(
                                agent.updatedAt.seconds * 1000,
                              ).toLocaleDateString()
                            : "-"
                        : agent.createdAt
                          ? typeof agent.createdAt === "number"
                            ? new Date(
                                agent.createdAt * 1000,
                              ).toLocaleDateString()
                            : agent.createdAt.seconds
                              ? new Date(
                                  agent.createdAt.seconds * 1000,
                                ).toLocaleDateString()
                              : "-"
                          : "-"}
                    </td>
                    <td className="p-2">{agent.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attention Needed Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l z-50 p-4 flex flex-col gap-4"
        style={{ display: topFailingAgents.length > 0 ? "block" : "none" }}
      >
        <h2 className="text-lg font-semibold mb-2">Attention Needed</h2>
        <div className="text-sm text-gray-700 mb-2">
          Clear issues for agents below:
        </div>
        {topFailingAgents.map((agent) => (
          <div
            key={agent.id}
            className="mb-2 p-2 border rounded flex flex-col gap-1"
          >
            <div>
              <strong>{agent.agentName || agent.id}</strong> (
              {agent.workspaceName || agent.workspaceId || "-"})
            </div>
            <div>Failures: {agent.failures ?? agent.count ?? "-"}</div>
            <div className="flex gap-2 mt-1">
              {/* 4. Any “Resolve/Acknowledge” action hits a server API route (founder-only) */}
              <button
                className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                onClick={async () => {
                  // Only founders can resolve
                  if (!isFounderUser) return;
                  await fetch("/api/founder/resolve-issue", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ issueId: agent.id }),
                  });
                  // Optionally, refresh list after
                }}
              >
                Mark Resolved
              </button>
              <button className="px-2 py-1 bg-gray-200 rounded text-xs">
                Ignore
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* System Health Panel */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">System Health</h2>
        {systemIssues.length === 0 ? (
          <div className="text-green-700">No system issues detected.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Workspace</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-left">Count</th>
                  <th className="p-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {systemIssues.map((issue) => (
                  <tr key={issue.id} className="border-t">
                    <td className="p-2">{issue.type}</td>
                    <td className="p-2">
                      {issue.workspaceName || issue.workspaceId || "-"}
                    </td>
                    <td className="p-2">{issue.description || "-"}</td>
                    <td className="p-2">{issue.count ?? "-"}</td>
                    <td className="p-2">
                      {issue.createdAt
                        ? typeof issue.createdAt === "number"
                          ? new Date(
                              issue.createdAt * 1000,
                            ).toLocaleDateString()
                          : issue.createdAt.seconds
                            ? new Date(
                                issue.createdAt.seconds * 1000,
                              ).toLocaleDateString()
                            : "-"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DocuSign Health Panel */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">DocuSign Health</h2>
        {docusignQueue.length === 0 ? (
          <div className="text-green-700">No DocuSign issues detected.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Workspace</th>
                  <th className="p-2 text-left">Contract</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Sent At</th>
                  <th className="p-2 text-left">Stuck Days</th>
                  <th className="p-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {docusignQueue.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">
                      {item.workspaceName || item.workspaceId}
                    </td>
                    <td className="p-2">{item.contractId}</td>
                    <td className="p-2">{item.status}</td>
                    <td className="p-2">
                      {item.sentAt
                        ? typeof item.sentAt === "number"
                          ? new Date(item.sentAt * 1000).toLocaleDateString()
                          : item.sentAt.seconds
                            ? new Date(
                                item.sentAt.seconds * 1000,
                              ).toLocaleDateString()
                            : "-"
                        : "-"}
                    </td>
                    <td className="p-2">{item.stuckDays ?? "-"}</td>
                    <td className="p-2">{item.error ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-4">
        <strong>Agent Runs (30d):</strong> {agentRuns}
        <br />
        <strong>Agent Failures (30d):</strong> {agentFailures}
        <br />
        <strong>Agent Cost (30d):</strong> {agentCost}
      </div>

      {/* Billing Health Panel */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Billing Health</h2>
        {billingIssues.length === 0 ? (
          <div className="text-green-700">No billing issues detected.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Workspace</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Plan</th>
                  <th className="p-2 text-left">Amount Due</th>
                  <th className="p-2 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {billingIssues.map((issue) => (
                  <tr key={issue.id} className="border-t">
                    <td className="p-2">
                      {issue.workspaceName || issue.workspaceId}
                    </td>
                    <td className="p-2">{issue.status}</td>
                    <td className="p-2">{issue.planId || "-"}</td>
                    <td className="p-2">
                      {typeof issue.amountDueCents === "number"
                        ? `$${(issue.amountDueCents / 100).toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="p-2">
                      {issue.updatedAt
                        ? typeof issue.updatedAt === "number"
                          ? new Date(
                              issue.updatedAt * 1000,
                            ).toLocaleDateString()
                          : issue.updatedAt.seconds
                            ? new Date(
                                issue.updatedAt.seconds * 1000,
                              ).toLocaleDateString()
                            : "-"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Source: Daily metrics and conversions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Data Source</h2>
        <div className="mb-2">
          <strong>Estimates (30d):</strong> {estimates ?? "-"}
          <br />
          <strong>Contracts (30d):</strong> {contracts ?? "-"}
          <br />
          <strong>Wins (30d):</strong> {wins ?? "-"}
        </div>
        <div className="mb-2">
          <strong>Contracts / Estimates:</strong> {contractsPerEstimates}
          <br />
          <strong>Wins / Contracts:</strong> {winsPerContracts}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Agent Trend (last {metrics.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Agent Runs</th>
                <th className="p-2 text-left">Agent Failures</th>
                <th className="p-2 text-left">Agent Cost</th>
                <th className="p-2 text-left">Estimates</th>
                <th className="p-2 text-left">Contracts</th>
                <th className="p-2 text-left">Wins</th>
                <th className="p-2 text-left">Contracts/Estimates</th>
                <th className="p-2 text-left">Wins/Contracts</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => {
                let ce = "-";
                let wc = "-";
                if (
                  typeof m.estimates30d === "number" &&
                  typeof m.contracts30d === "number" &&
                  m.estimates30d > 0
                ) {
                  ce = `${((m.contracts30d / m.estimates30d) * 100).toFixed(1)}%`;
                }
                if (
                  typeof m.contracts30d === "number" &&
                  typeof m.wins30d === "number" &&
                  m.contracts30d > 0
                ) {
                  wc = `${((m.wins30d / m.contracts30d) * 100).toFixed(1)}%`;
                }
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2">{m.date || "-"}</td>
                    <td className="p-2">
                      {typeof m.agentRuns === "number" ? m.agentRuns : "-"}
                    </td>
                    <td className="p-2">
                      {typeof m.agentFailures === "number"
                        ? m.agentFailures
                        : "-"}
                    </td>
                    <td className="p-2">
                      {typeof m.agentCostCents === "number"
                        ? `$${(m.agentCostCents / 100).toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="p-2">
                      {typeof m.estimates30d === "number"
                        ? m.estimates30d
                        : "-"}
                    </td>
                    <td className="p-2">
                      {typeof m.contracts30d === "number"
                        ? m.contracts30d
                        : "-"}
                    </td>
                    <td className="p-2">
                      {typeof m.wins30d === "number" ? m.wins30d : "-"}
                    </td>
                    <td className="p-2">{ce}</td>
                    <td className="p-2">{wc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
