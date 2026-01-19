"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function OnboardingDataPreview() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }
        // Assume workspaceId = user.uid for MVP
        // TODO: Replace with workflowStates path
        const snap = await getDoc(onboardingRef);
        if (snap.exists()) {
          setData(snap.data());
        } else {
          setError("No onboarding data found.");
        }
      } catch {
        setError("Failed to fetch onboarding data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading onboarding data…</div>;
  if (error) return <div className="p-6 text-danger">{error}</div>;
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-xl font-semibold mb-4 text-foreground">Onboarding Data Preview</h1>
        <pre className="bg-dark-surface rounded p-4 text-xs overflow-x-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </main>
  );
}
