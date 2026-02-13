"use client";
import { db } from "@/lib/firebase";
import { useWorkspace } from "@/lib/workspaceContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";
import OnboardingLayout from "../OnboardingLayout";
// import { saveOnboardingStep } from "@/lib/onboarding";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const [confirmed, setConfirmed] = useState(false);
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
      // Extract all onboarding step data
      const onboardingRef = doc(
        db,
        "workspaces",
        workspaceId,
        "onboarding",
        "state",
      );
      const onboardingSnap = await getDoc(onboardingRef);
      let onboardingData = {};
      if (onboardingSnap.exists()) {
        const data = onboardingSnap.data();
        onboardingData = data.data || {};
      }
      // Merge onboarding data into workspace document (for launch)
      const workspaceRef = doc(db, "workspaces", workspaceId);
      await setDoc(
        workspaceRef,
        {
          onboarding: onboardingData,
          onboardingComplete: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      // Mark onboarding as complete in onboarding state
      await setDoc(
        onboardingRef,
        {
          status: "complete",
          completedAt: new Date().toISOString(),
          step: "review-finish",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      router.push("/dashboard");
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
    <OnboardingLayout step={11}>
      <h1 className="text-2xl font-bold mb-4 text-slate-900">
        Review & Finish
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-page-surface/80 p-8 rounded-xl shadow w-full max-w-md space-y-4"
      >
        <div>
          <label className="block mb-1 text-slate-700">
            Confirm all info is correct
          </label>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            className="bg-muted px-4 py-2 rounded"
            onClick={() => router.push("/onboarding/step/10")}
          >
            Back
          </button>
          <button
            type="submit"
            className="bg-accent text-background px-4 py-2 rounded"
            disabled={loading || !confirmed}
          >
            {loading ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
