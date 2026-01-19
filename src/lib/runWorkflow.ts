export async function runWorkflow(workflowId: string, workspaceId: string) {
  async function readJsonSafe(res: Response) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { __nonJson: true, raw: text };
    }
  }

  const res = await fetch(`/api/ai/workflows/${workflowId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, context: {} }),
  });

  const json = await readJsonSafe(res);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}${json ? ` -> ${JSON.stringify(json)}` : ""}`);
  }
  if (!json?.ok) throw new Error((json as any)?.error || "Failed to run workflow");

  // optional: redirect user to Runs page and select the run
  // localStorage.setItem("lastRunId", json.runId);
  window.location.href = "/app/workflow-runs";
}
