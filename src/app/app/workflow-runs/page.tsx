"use client";

import { useEffect, useState } from "react";
import RunDetails from "@/components/RunDetails";
import { runWorkflow } from "@/lib/runWorkflow";

// If you already have a workspace context/store, swap this out.
// For now, we accept workspaceId from localStorage (common in your app pattern).
function getWorkspaceId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("workspaceId") ?? "";
}

type RunRow = {
  id: string;
  [key: string]: unknown;
};

export default function RunsPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [workflowIdInput, setWorkflowIdInput] = useState("");
  const [runningWorkflow, setRunningWorkflow] = useState(false);

  async function readJsonSafe(res: Response) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { __nonJson: true, raw: text };
    }
  }

  useEffect(() => {
    setWorkspaceId(getWorkspaceId());
  }, []);

  const handleWorkspaceChange = (value: string) => {
    setWorkspaceId(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("workspaceId", value);
    }
  };



  async function handleRunWorkflow() {
    if (!workflowIdInput || !workspaceId) return;
    setRunningWorkflow(true);
    try {
      await runWorkflow(workflowIdInput, workspaceId);
    } catch (e: unknown) {
      let msg = "Failed to run workflow";
      if (typeof e === "object" && e && "message" in e && typeof (e as { message?: unknown }).message === "string") {
        msg = (e as { message: string }).message;
      }
      setErr(msg);
      setRunningWorkflow(false);
      setShowRunModal(false);
    }
  }


  async function loadRuns(signal?: AbortSignal) {
    if (!workspaceId) return;
    setErr(null);

    try {
      const res = await fetch(`/api/ai/workflows/runs?workspaceId=${encodeURIComponent(workspaceId)}`, {
        signal,
        cache: "no-store",
      });

      const body = await readJsonSafe(res);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}${body ? ` -> ${JSON.stringify(body)}` : ""}`);
      }

      if (!body || typeof body !== 'object' || !('ok' in body) || !(body as { ok: unknown }).ok) {
        const errorMsg = typeof body === 'object' && body && 'error' in body && typeof (body as { error?: unknown }).error === 'string'
          ? (body as { error: string }).error
          : "Failed to load runs";
        throw new Error(errorMsg);
      }
      const runsPayload = (body as { runs?: unknown[] }).runs ?? [];
      setRuns(Array.isArray(runsPayload) ? runsPayload as RunRow[] : []);
      if (!selectedRunId && Array.isArray(runsPayload) && runsPayload[0] && typeof runsPayload[0] === 'object' && 'id' in runsPayload[0]) {
        setSelectedRunId((runsPayload[0] as { id: string }).id);
      }
    } catch (e: unknown) {
      if (typeof e === 'object' && e && 'name' in e && (e as { name?: unknown }).name === 'AbortError') return;
      let msg = "Failed to load runs";
      if (typeof e === "object" && e && "message" in e && typeof (e as { message?: unknown }).message === "string") {
        msg = (e as { message: string }).message;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!workspaceId) return;

    const controller = new AbortController();
    loadRuns(controller.signal);

    const t = setInterval(() => loadRuns(), 2500);

    return () => {
      controller.abort();
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Workflow Runs</h1>
          <p className="text-sm text-muted-foreground">
            Live execution monitor (polling). Workspace: <span className="font-mono">{workspaceId || "—"}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-2 border rounded px-2 py-1 bg-[#0f1624] border-[#252f42]">
            <label className="text-xs text-[#e8edf7]">Workspace</label>
            <input
              className="bg-transparent text-[#e8edf7] text-xs outline-none"
              value={workspaceId}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
              placeholder="workspaceId"
            />
          </div>
          <button
            onClick={() => setShowRunModal(true)}
            className="px-3 py-2 rounded border text-sm bg-[#59f2c2] text-[#0c111a] hover:bg-[#4ad9a8] font-medium"
          >
            Run Workflow
          </button>
          <button
            onClick={() => loadRuns()}
            className="px-3 py-2 rounded border text-sm text-[#e8edf7] hover:bg-[#1b2435]"
          >
            Refresh
          </button>
        </div>
      </div>

      {showRunModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1b2435] rounded border border-[#252f42] p-6 shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-4 text-[#e8edf7]">Run Workflow</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#e8edf7]">Workflow ID</label>
                <input
                  type="text"
                  value={workflowIdInput}
                  onChange={(e) => setWorkflowIdInput(e.target.value)}
                  placeholder="e.g., wf-123..."
                  className="w-full px-3 py-2 rounded border text-sm bg-[#0f1624] text-[#e8edf7] border-[#252f42] placeholder-[#7985a8]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowRunModal(false);
                    setWorkflowIdInput("");
                  }}
                  disabled={runningWorkflow}
                  className="px-3 py-2 rounded border text-sm text-[#e8edf7] hover:bg-[#252f42] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunWorkflow}
                  disabled={!workflowIdInput || runningWorkflow}
                  className="px-3 py-2 rounded border text-sm bg-[#59f2c2] text-[#0c111a] hover:bg-[#4ad9a8] disabled:opacity-50 font-medium"
                >
                  {runningWorkflow ? "Running…" : "Run"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {!workspaceId && (
        <div className="p-4 rounded border bg-muted/30">
          <div className="font-medium">No workspaceId found</div>
          <div className="text-sm text-muted-foreground">
            Set <span className="font-mono">localStorage.workspaceId</span> or wire to your workspace selector.
          </div>
        </div>
      )}

      {err && (
        <div className="p-4 rounded border border-[#ff9b76] bg-[rgba(255,155,118,0.1)] text-[#ff9b76]">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Runs list */}
        <div className="rounded border overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
            <div className="font-medium">Recent Runs</div>
            <div className="text-xs text-muted-foreground">{runs.length}</div>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : runs.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No runs yet. Trigger a workflow run and it will appear here.
            </div>
          ) : (
            <div className="divide-y">
              {runs.map((r) => {
                const status = typeof r.status === 'string' ? r.status : '';
                const workflowId = typeof r.workflowId === 'string' ? r.workflowId : '';
                const nextStepIndex = typeof r.nextStepIndex === 'number' ? r.nextStepIndex : 0;
                const steps = Array.isArray(r.steps) ? r.steps : [];
                return (
                  <button
                    key={String(r.id)}
                    onClick={() => setSelectedRunId(String(r.id))}
                    className={`w-full text-left p-3 hover:bg-muted/30 ${
                      selectedRunId === r.id ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs truncate">{String(r.id)}</div>
                      <span className="text-xs px-2 py-1 rounded border">
                        {status}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      <span className="font-mono">workflow: {workflowId}</span>
                      <span>step: {nextStepIndex}/{steps.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Run details */}
        <div className="lg:col-span-2">
          <RunDetails runId={selectedRunId} />
        </div>
      </div>
    </div>
  );
}
