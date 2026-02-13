"use client";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
// import useAuth from "@/lib/useAuth";
import { useAuth } from "@/hooks/useAuth";
// useAuth is not found in src/lib. If needed, replace with correct import or remove usage.
// import useWorkspace from "../../lib/useWorkspace";
import { useWorkspace } from "@/lib/workspaceContext";

export default function OnboardingDataPreview() {
  // Controlled input for editing a sample onboarding value
  const [sampleValue, setSampleValue] = useState("");
  const handleSampleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSampleValue(newValue);
    // Update Firestore with new sampleValue
    if (workflowStatesRef) {
      try {
        await setDoc(
          workflowStatesRef,
          { sampleValue: newValue },
          { merge: true },
        );
      } catch {
        setError("Failed to update onboarding value in Firestore.");
      }
    }
  };
  // Add overlay CSS fix for pointer events
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `.overlay { pointer-events: none !important; }`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  // Use workspaceId from context and reference workflowStates
  const { user, loading } = useAuth();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  // Use user.uid for workflowStates document key
  const workflowStatesRef =
    workspaceId && user?.uid
      ? doc(db, "workspaces", workspaceId, "workflowStates", user.uid)
      : null;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return; // Wait for auth to finish loading
    if (!user || !workflowStatesRef) {
      setError("Missing workspace or user context");
      return;
    }
    async function fetchData() {
      setError(null);
      try {
        if (workflowStatesRef) {
          const snap = await getDoc(workflowStatesRef);
          if (snap.exists()) {
            setData(snap.data());
            // If sampleValue exists in Firestore, sync it to input
            if (snap.data().sampleValue !== undefined) {
              setSampleValue(snap.data().sampleValue);
            }
          } else {
            // Fallback: create empty onboarding state for user
            await setDoc(
              workflowStatesRef,
              { startedAt: new Date().toISOString() },
              { merge: true },
            );
            setData({ startedAt: new Date().toISOString() });
          }
        }
      } catch {
        setError("Failed to fetch onboarding data.");
      }
    }
    fetchData();
  }, [workflowStatesRef, user, loading]);

  if (loading) return <div className="p-6">Loading onboarding data…</div>;
  if (error) return <div className="p-6 text-danger">{error}</div>;
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-xl font-semibold mb-4 text-foreground">
          Onboarding Data Preview
        </h1>
        <div className="mb-4">
          <label
            className={
              sampleValue
                ? "label-small block text-sm font-medium mb-1"
                : "label-placeholder block text-sm font-medium mb-1 text-muted"
            }
          >
            Sample Value
          </label>
          <input
            type="text"
            value={sampleValue}
            onChange={handleSampleChange}
            className="w-full rounded border px-3 py-2 text-base bg-background text-foreground focus:ring-2 focus:ring-blue-400"
            placeholder="Edit onboarding value..."
          />
          {!sampleValue && (
            <div className="text-xs text-muted mt-1">
              Enter a value to update onboarding data.
            </div>
          )}
        </div>
        <pre className="bg-dark-surface rounded p-4 text-xs overflow-x-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </main>
  );
}
