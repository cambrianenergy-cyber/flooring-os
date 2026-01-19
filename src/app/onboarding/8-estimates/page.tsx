"use client";
import OnboardingLayout from "../OnboardingLayout";
import { useState } from "react";
// import { saveOnboardingStep } from "@/lib/onboarding";
import { useRouter } from "next/navigation";

export default function EstimatesPage() {
  const [estimateType, setEstimateType] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with workflow state logic
      router.push("/onboarding/9-catalog");
    } catch (err: unknown) {
      if (typeof err === "object" && err && "message" in err) {
        setError((err as { message?: string }).message || "Failed to save. Try again.");
      } else {
        setError("Failed to save. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingLayout step={8}>
      <h1 className="text-2xl font-bold mb-4">Estimate Workflow</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Estimate Type</label>
          <input className="w-full border rounded p-2" value={estimateType} onChange={e => setEstimateType(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Workflow</label>
          <input className="w-full border rounded p-2" value={workflow} onChange={e => setWorkflow(e.target.value)} required />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button type="button" className="bg-muted px-4 py-2 rounded" onClick={() => router.push("/onboarding/7-leads")}>Back</button>
          <button type="submit" className="bg-accent text-background px-4 py-2 rounded" disabled={loading}>{loading ? "Saving…" : "Save & Continue"}</button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
