"use client";
import OnboardingLayout from "../OnboardingLayout";
import { useState } from "react";
import { useWorkspace } from "@/lib/workspaceContext";
// import { saveOnboardingStep } from "@/lib/onboarding";
import { useRouter } from "next/navigation";

export default function ServiceAreaPage() {
  const { workspace } = useWorkspace();
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with workflow state logic
      router.push("/onboarding/4-team");
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
    <OnboardingLayout step={3}>
      {workspace && Array.isArray(workspace.plan?.activeAddOns) && workspace.plan.activeAddOns.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="font-semibold mb-1 text-blue-900">Active Paid Add-Ons:</div>
          <ul className="list-disc ml-5 text-blue-800">
            {workspace.plan.activeAddOns.map((addon) => (
              <li key={addon}>{addon}</li>
            ))}
          </ul>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Service Area</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Zip Code</label>
          <input className="w-full border rounded p-2" value={zip} onChange={e => setZip(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Radius (miles)</label>
          <input className="w-full border rounded p-2" value={radius} onChange={e => setRadius(e.target.value)} required />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button type="button" className="bg-muted px-4 py-2 rounded" onClick={() => router.push("/onboarding/2-company")}>Back</button>
          <button type="submit" className="bg-accent text-background px-4 py-2 rounded" disabled={loading}>{loading ? "Saving…" : "Save & Continue"}</button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
