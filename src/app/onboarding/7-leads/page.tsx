"use client";
import { db } from "@/lib/firebase";
import { useWorkspace } from "@/lib/workspaceContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingGuard from "../OnboardingGuard";
import OnboardingLayout from "../OnboardingLayout";

export default function LeadsPage() {
  const { workspace } = useWorkspace();
  const [leadSource, setLeadSource] = useState("");
  const [intakeMethod, setIntakeMethod] = useState("");
  const workspaceId = workspace?.id;

  useEffect(() => {
    if (!workspaceId) return;
    const fetchData = async () => {
      try {
        const ref = doc(db, "workspaces", workspaceId, "onboarding", "state");
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().leadIntake) {
          const { leadSource, intakeMethod } = snap.data().leadIntake;
          if (leadSource) setLeadSource(leadSource);
          if (intakeMethod) setIntakeMethod(intakeMethod);
        }
      } catch {}
    };
    fetchData();
  }, [workspaceId]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) {
      setError("Workspace ID is missing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setDoc(
        doc(db, "workspaces", workspaceId, "onboarding", "state"),
        {
          leadIntake: { leadSource, intakeMethod },
          step: "lead-intake",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      router.push("/onboarding/step/8");
    } catch (err: unknown) {
      if (typeof err === "object" && err && "message" in err) {
        setError(
          (err as { message?: string }).message || "Failed to save. Try again.",
        );
      } else {
        setError("Failed to save. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingGuard stepNumber={7}>
      <OnboardingLayout step={7}>
        {workspace &&
          Array.isArray(workspace.plan?.activeAddOns) &&
          workspace.plan.activeAddOns.length > 0 && (
            <div className="mb-4 p-4 rounded-xl border bg-page-surface/80">
              <div className="font-semibold mb-1 text-slate-900">
                Active Paid Add-Ons:
              </div>
              <ul className="list-disc ml-5 text-slate-800">
                {workspace.plan.activeAddOns.map((addon) => (
                  <li key={addon}>{addon}</li>
                ))}
              </ul>
            </div>
          )}
        <h1 className="text-2xl font-bold mb-4 text-slate-900">Lead Intake</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-page-surface/80 p-8 rounded-xl shadow w-full max-w-md space-y-4"
        >
          <div>
            <label className="block mb-1 text-slate-700">Lead Source</label>
            <input
              className="w-full border rounded p-2 bg-page-surface text-slate-900"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-slate-700">Intake Method</label>
            <input
              className="w-full border rounded p-2 bg-page-surface text-slate-900"
              value={intakeMethod}
              onChange={(e) => setIntakeMethod(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              className="bg-muted px-4 py-2 rounded"
              onClick={() => router.push("/onboarding/6-pricing")}
            >
              Back
            </button>
            <button
              type="submit"
              className="bg-accent text-background px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save & Continue"}
            </button>
          </div>
        </form>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
