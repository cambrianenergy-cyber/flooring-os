"use client";
import OnboardingLayout from "../OnboardingLayout";
import { useState } from "react";
// Define the type for pricing
type Pricing = {
  basePrice: string;
  laborRate: string;
};
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useWorkspace } from "../../../lib/workspaceContext";
import { useOnboardingState } from "../../../components/onboarding/FormCard";
import OnboardingGuard from "../OnboardingGuard";

export default function PricingPage() {
  const [basePrice, setBasePrice] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { data: onboardingData } = useOnboardingState(workspace?.id || "");

  // Populate saved pricing info from onboarding state
  const savedPricing = onboardingData?.pricing as Pricing | undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken();
      const res = await fetch("/api/onboarding/save-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          currentStep: "plan", // must match backend schema
          updatedAt: Date.now(),
          data: {
            pricing: {
              basePrice,
              laborRate,
            },
            workspaceId: workspace?.id,
          },
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }
      router.push("/onboarding/7-leads");
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
    <OnboardingGuard stepNumber={6}>
      <OnboardingLayout step={6}>
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
        <h1 className="text-2xl font-bold mb-4">Pricing Defaults</h1>
        {savedPricing && typeof savedPricing.basePrice === "string" && typeof savedPricing.laborRate === "string" && (
          <div className="mb-4 p-4 border rounded bg-muted">
            <div className="font-semibold">Saved Pricing Info:</div>
            <div>Base Price: {savedPricing.basePrice}</div>
            <div>Labor Rate: {savedPricing.laborRate}</div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="base-price" className="block mb-1">Base Price</label>
            <input id="base-price" name="base-price" className="w-full border rounded p-2" value={basePrice} onChange={e => setBasePrice(e.target.value)} required placeholder="Enter base price" />
          </div>
          <div>
            <label htmlFor="labor-rate" className="block mb-1">Labor Rate</label>
            <input id="labor-rate" name="labor-rate" className="w-full border rounded p-2" value={laborRate} onChange={e => setLaborRate(e.target.value)} required placeholder="Enter labor rate" />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-4 mt-6">
            <button type="button" className="bg-muted px-4 py-2 rounded" onClick={() => router.push("/onboarding/5-services")}>Back</button>
            <button type="submit" className="bg-accent text-background px-4 py-2 rounded" disabled={loading}>{loading ? "Saving…" : "Save & Continue"}</button>
          </div>
        </form>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
