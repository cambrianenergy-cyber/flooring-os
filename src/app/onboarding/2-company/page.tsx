"use client";

import OnboardingLayout from "../OnboardingLayout";
import { useState, useEffect } from "react";
import { useWorkspace } from "@/lib/workspaceContext";
// import { saveOnboardingStep } from "@/lib/onboarding";
import { useRouter } from "next/navigation";

export default function CompanyPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedCompany, setSavedCompany] = useState<{ companyName?: string; industry?: string } | null>(null);
  const router = useRouter();
  const { workspace } = useWorkspace();

  // Fetch saved company info on mount
  useEffect(() => {
    async function fetchCompanyInfo() {
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { auth, db } = await import("@/lib/firebase");
        const user = auth.currentUser;
        if (!user) return;
        const onboardingRef = doc(db, `workspaces/${user.uid}/onboarding/state`);
        const snap = await getDoc(onboardingRef);
        if (snap.exists() && snap.data().data && snap.data().data[2]) {
          setSavedCompany(snap.data().data[2]);
        }
      } catch {}
    }
    fetchCompanyInfo();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with workflow state logic
      setSavedCompany({ companyName, industry });
      router.push("/onboarding/3-service-area");
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
    <OnboardingLayout step={2}>
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
      <h1 className="text-2xl font-bold mb-4">Company Info</h1>
      {savedCompany && (
        <div className="mb-4 p-4 border rounded bg-muted">
          <div className="font-semibold">Saved Company Info:</div>
          <div>Company Name: {savedCompany.companyName}</div>
          <div>Industry: {savedCompany.industry}</div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="company-name" className="block mb-1">Company Name</label>
          <input id="company-name" name="company-name" className="w-full border rounded p-2" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="industry" className="block mb-1">Industry</label>
          <input id="industry" name="industry" className="w-full border rounded p-2" value={industry} onChange={e => setIndustry(e.target.value)} required />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button type="button" className="bg-muted px-4 py-2 rounded" onClick={() => router.push("/onboarding/1-welcome")}>Back</button>
          <button type="submit" className="bg-accent text-background px-4 py-2 rounded" disabled={loading}>{loading ? "Saving…" : "Save & Continue"}</button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
