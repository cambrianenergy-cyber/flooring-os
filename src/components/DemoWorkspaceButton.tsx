import React, { useState } from "react";

export default function DemoWorkspaceButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createDemoWorkspace() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/workspaces/demo", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatus("Demo workspace created!");
      } else {
        setStatus("Failed to create workspace.");
      }
    } catch (e) {
      setStatus("Error creating workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function checkDemoWorkspace() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/workspaces/demo");
      const data = await res.json();
      if (data.exists) {
        setStatus("Demo workspace exists! Data: " + JSON.stringify(data.data));
      } else {
        setStatus("Demo workspace does not exist.");
      }
    } catch (e) {
      setStatus("Error checking workspace.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="my-6 p-4 border rounded bg-background text-slate-900 max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Demo Workspace Actions</h2>
      <div className="flex gap-3 mb-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={createDemoWorkspace}
          disabled={loading}
        >
          Create Demo Workspace
        </button>
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={checkDemoWorkspace}
          disabled={loading}
        >
          Check Demo Workspace
        </button>
      </div>
      {status && <div className="mt-2 text-sm text-blue-700 whitespace-pre-wrap">{status}</div>}
    </div>
  );
}
