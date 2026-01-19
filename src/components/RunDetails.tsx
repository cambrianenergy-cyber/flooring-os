"use client";


import { useEffect, useState } from "react";
import type { WorkflowRunDoc, WorkflowRunStepSnapshot } from "@/lib/types";

export default function RunDetails({ runId }: { runId: string | null }) {
  const [run, setRun] = useState<WorkflowRunDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyStep, setBusyStep] = useState<number | null>(null);

  async function readJsonSafe(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { __nonJson: true, raw: text };
    }
  }

  async function load(signal?: AbortSignal) {
    if (!runId) return;
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/ai/workflows/runs/${runId}`, { signal, cache: "no-store" });
      const body = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}${body ? ` -> ${JSON.stringify(body)}` : ""}`);
      }
      if (typeof body !== "object" || body === null || !('ok' in body)) throw new Error("Failed to load run");
      if (!(body as { ok: boolean }).ok) throw new Error((body as { error?: string })?.error || "Failed to load run");
      if (
        typeof body === "object" &&
        body !== null &&
        "run" in body &&
        (body as { run?: unknown }).run &&
        typeof (body as { run: unknown }).run === "object"
      ) {
        setRun((body as unknown as { run: WorkflowRunDoc }).run);
      } else {
        setRun(null);
      }
    } catch (e) {
      if (
        typeof e === "object" &&
        e !== null &&
        "name" in e &&
        (e as { name?: string }).name === "AbortError"
      )
        return;
      setErr(e instanceof Error ? e.message : "Failed to load run");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!runId) return;
    setErr(null);
    setLoading(true);

    let closed = false;
    let source: EventSource | null = null;

    const startStream = () => {
      source = new EventSource(`/api/ai/workflows/runs/${runId}?stream=1`);

      source.addEventListener("run", (event) => {
        if (closed) return;
        try {
          const payload = JSON.parse((event as MessageEvent).data ?? "null");
          setRun(payload?.run ?? payload);
          setLoading(false);
          setErr(null);
        } catch (e) {
          console.error("Failed to parse run event", e);
        }
      });

      source.addEventListener("error", () => {
        if (closed) return;
        // Fall back to a one-shot fetch if SSE drops
        source?.close();
        load().catch((e) => console.error("Fallback load failed", e));
        setErr((prev) => prev ?? "Live stream interrupted; reloading once.");
        setLoading(false);
      });
    };

    startStream();

    return () => {
      closed = true;
      source?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  async function retryNow(stepIndex: number) {
    if (!runId) return;
    setBusyStep(stepIndex);

    try {
      const res = await fetch(`/api/ai/workflows/runs/${runId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepIndex }),
      });
      const body = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}${body ? ` -> ${JSON.stringify(body)}` : ""}`);
      }
      if (typeof body !== "object" || body === null || !('ok' in body)) throw new Error("Retry failed");
      if (!(body as { ok: boolean }).ok) throw new Error((body as { error?: string })?.error || "Retry failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setBusyStep(null);
    }
  }

  if (!runId) {
    return (
      <div className="rounded border p-4 text-sm text-gray-800">
        Select a run to view details.
      </div>
    );
  }

  if (loading && !run) {
    return <div className="rounded border p-4 text-sm text-gray-800">Loading run…</div>;
  }

  if (err) {
    return (
      <div className="rounded border p-4 border-red-300 bg-red-50 text-red-800">
        {err}
      </div>
    );
  }

  if (!run) {
    return (
      <div className="rounded border p-4 text-sm text-gray-800">
        Run not found.
      </div>
    );
  }

  const steps: WorkflowRunStepSnapshot[] = run.steps ?? [];

  return (
    <div className="rounded border overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Run Details</div>
            {/* No run.id in WorkflowRunDoc; could use workflowId or show nothing */}
            <div className="font-mono text-xs text-gray-800 break-all">{run.workflowId}</div>
          </div>
          <span className="text-xs px-2 py-1 rounded border">{run.status}</span>
        </div>

        <div className="mt-2 text-xs text-gray-800 flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-mono">workflowId: {run.workflowId}</span>
          <span>nextStepIndex: {run.nextStepIndex ?? 0}</span>
          <span>steps: {steps.length}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Steps */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Steps</div>

          {steps.length === 0 ? (
            <div className="text-sm text-gray-800">No steps in this run.</div>
          ) : (
            <div className="space-y-3">
              {steps.map((s, i) => {
                // nextAttemptAt can be a Firestore Timestamp or undefined/null
                let nextAttemptAt: string | null = null;
                if (s.nextAttemptAt && typeof s.nextAttemptAt === "object" && "seconds" in s.nextAttemptAt && typeof (s.nextAttemptAt as { seconds?: number }).seconds === "number") {
                  nextAttemptAt = new Date((s.nextAttemptAt as { seconds: number }).seconds * 1000).toLocaleString();
                }

                return (
                  <div key={s.stepId ?? i} className="rounded border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded border">{s.status}</span>
                          <span className="text-xs font-mono">#{i}</span>
                          <span className="text-xs font-mono">{s.agentType}</span>
                        </div>

                        <div className="mt-2 text-sm whitespace-pre-wrap">
                          {s.instruction}
                        </div>

                        <div className="mt-2 text-xs text-gray-800 flex flex-wrap gap-x-4 gap-y-1">
                          <span>attempts: {s.attempts ?? 0}/{typeof s.maxAttempts === "number" ? s.maxAttempts : 3}</span>
                          {nextAttemptAt && <span>nextAttemptAt: {nextAttemptAt}</span>}
                        </div>

                        {s.error && (
                          <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                            {s.error}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => retryNow(i)}
                          disabled={busyStep === i}
                          className="px-3 py-2 rounded border text-xs hover:bg-muted disabled:opacity-50"
                        >
                          {busyStep === i ? "Retrying…" : "Retry now"}
                        </button>
                      </div>
                    </div>

                    {/* Output viewer */}
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-800 mb-1">Output</div>
                      <pre className="text-xs bg-muted/30 rounded p-2 overflow-auto">
{JSON.stringify(s.output ?? null, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Context */}
        <div>
          <div className="text-sm font-medium">Run Context</div>
          <pre className="text-xs bg-muted/30 rounded p-3 overflow-auto mt-2">
{JSON.stringify(run.context ?? {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
