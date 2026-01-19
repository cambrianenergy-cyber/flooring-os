"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";

export default function CompanyOnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // TODO: Save company info to onboarding state
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
          currentStep: "company",
          updatedAt: Date.now(),
          data: {
            company: {
              companyName,
              industry,
            },
          },
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }
      router.push("/onboarding/3-service-area");
    } catch (err) {
      setError("Failed to save. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-page-bg">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold mb-4">Company Information</h1>
        <div>
          <label className="block mb-1">Company Name</label>
          <input className="w-full border rounded p-2" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Industry</label>
          <input className="w-full border rounded p-2" value={industry} onChange={e => setIndustry(e.target.value)} required />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button type="submit" className="bg-accent text-background px-4 py-2 rounded" disabled={loading}>{loading ? "Saving…" : "Save & Continue"}</button>
        </div>
      </form>
    </main>
  );
}
