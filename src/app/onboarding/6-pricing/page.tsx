"use client";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOnboardingState } from "../../../components/onboarding/FormCard";
import { useWorkspace } from "../../../lib/workspaceContext";
import OnboardingGuard from "../OnboardingGuard";
import OnboardingLayout from "../OnboardingLayout";
// Define the type for pricing
type Pricing = {
  basePrice: string;
  laborRate: string;
};

export default function PricingPage() {
  const { workspace } = useWorkspace();
  const [basePrice, setBasePrice] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const workspaceId = workspace?.id;

  useEffect(() => {
    if (!workspaceId) return;
    const fetchData = async () => {
      try {
        const ref = doc(db, "workspaces", workspaceId, "onboarding", "state");
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().pricing) {
          const { basePrice, laborRate } = snap.data().pricing;
          if (basePrice) setBasePrice(basePrice);
          if (laborRate) setLaborRate(laborRate);
        }
      } catch {}
    };
    fetchData();
  }, [workspaceId]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // (moved to top)
  const { data: onboardingData } = useOnboardingState(workspace?.id || "");

  // Populate saved pricing info from onboarding state
  const savedPricing = onboardingData?.pricing as Pricing | undefined;

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
          pricing: { basePrice, laborRate },
          step: "pricing",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      router.push("/onboarding/step/7");
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
    <OnboardingGuard stepNumber={6}>
      <OnboardingLayout step={6}>
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
        <h1 className="text-2xl font-bold mb-4 text-slate-900">
          Pricing Defaults
        </h1>
        {savedPricing &&
          typeof savedPricing.basePrice === "string" &&
          typeof savedPricing.laborRate === "string" && (
            <div className="mb-4 p-4 border rounded bg-muted">
              <div className="font-semibold">Saved Pricing Info:</div>
              <div>Base Price: {savedPricing.basePrice}</div>
              <div>Labor Rate: {savedPricing.laborRate}</div>
            </div>
          )}
        <form
          onSubmit={handleSubmit}
          className="bg-page-surface/80 p-8 rounded-xl shadow w-full max-w-md space-y-4"
        >
          <div>
            <label htmlFor="base-price" className="block mb-1 text-slate-700">
              Base Price
            </label>
            <input
              id="base-price"
              name="base-price"
              className="w-full border rounded p-2 bg-page-surface text-slate-900"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
              placeholder="Enter base price"
            />
          </div>
          <div>
            <label htmlFor="labor-rate" className="block mb-1 text-slate-700">
              Labor Rate
            </label>
            <input
              id="labor-rate"
              name="labor-rate"
              className="w-full border rounded p-2 bg-page-surface text-slate-900"
              value={laborRate}
              onChange={(e) => setLaborRate(e.target.value)}
              required
              placeholder="Enter labor rate"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              className="bg-muted px-4 py-2 rounded"
              onClick={() => router.push("/onboarding/5-services")}
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
