"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import AuthGuard from "@/components/AuthGuard";

function useWorkspaceId() {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  useEffect(() => {
    const ws = typeof window === "undefined" ? "" : localStorage.getItem("workspaceId") || "";
    setWorkspaceId(ws);
  }, []);
  return workspaceId;
}

async function fetchCollection(path: string, workspaceId: string, orderField: string, desc = true, max = 10) {
  const q = query(
    collection(db, path),
    where("workspaceId", "==", workspaceId),
    orderBy(orderField, desc ? "desc" : "asc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default function ObservabilityDashboard() {
  const workspaceId = useWorkspaceId();
  const [loading, setLoading] = useState(false);
  const [agentRuns, setAgentRuns] = useState<any[]>([]);
  const [workflowFailures, setWorkflowFailures] = useState<any[]>([]);
  const [workflowTriggers, setWorkflowTriggers] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setError("");
    Promise.all([
      fetchCollection("agent_runs", workspaceId, "updatedAt"),
      fetchCollection("workflow_failures", workspaceId, "occurredAt"),
      fetchCollection("workflow_triggers", workspaceId, "firedAt"),
      fetchCollection("audit_logs", workspaceId, "createdAt"),
    ])
      .then(([runs, failures, triggers, audits]) => {
        setAgentRuns(runs.filter((r: any) => r.status === "failed"));
        setWorkflowFailures(failures.filter((f: any) => f.status === "open"));
        setWorkflowTriggers(triggers);
        setAuditEvents(audits);
      })
      .catch((err) => setError(err?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (!workspaceId) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold">Observability</h1>
        <p className="text-sm text-gray-600">Set localStorage.workspaceId to view workspace data.</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Observability</h1>
          {loading && <span className="text-xs text-gray-500">Loading…</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Failed Agent Runs" items={agentRuns} fields={["agentId", "status", "error", "updatedAt"]} />
          <Card title="Open Workflow Failures" items={workflowFailures} fields={["workflowId", "runId", "message", "occurredAt"]} />
          <Card title="Recent Workflow Triggers" items={workflowTriggers} fields={["workflowId", "source", "eventKey", "firedAt"]} />
          <Card title="Recent Audit Events" items={auditEvents} fields={["action", "entityType", "entityId", "createdAt"]} />
        </div>
      </div>
    </AuthGuard>
  );
}

function Card({ title, items, fields }: { title: string; items: any[]; fields: string[] }) {
  return (
    <div className="border rounded p-3 bg-white shadow-sm">
      <div className="font-medium mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">No data</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="border rounded p-2 text-xs bg-gray-50">
              {fields.map((f) => (
                <div key={f} className="flex justify-between gap-2">
                  <span className="text-gray-500">{f}</span>
                  <span className="text-gray-900 break-all">{String(item[f] ?? "")} </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
