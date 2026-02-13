"use client";
import { db } from "@/lib/firebase";
import { useWorkspace } from "@/lib/workspaceContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import OnboardingLayout from "../OnboardingLayout";
// import { saveOnboardingStep } from "@/lib/onboarding";
import { useRouter } from "next/navigation";

export default function CatalogPage() {
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const [materials, setMaterials] = useState("");
  const [vendors, setVendors] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!workspaceId) return;
    const fetchData = async () => {
      try {
        const ref = doc(db, "workspaces", workspaceId, "onboarding", "state");
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().catalog) {
          const { materials, vendors } = snap.data().catalog;
          if (materials) setMaterials(materials);
          if (vendors) setVendors(vendors);
        }
      } catch {}
    };
    fetchData();
  }, [workspaceId]);

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
          catalog: { materials, vendors },
          step: "catalog",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      router.push("/onboarding/step/10");
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
    <OnboardingLayout step={9}>
      <h1 className="text-2xl font-bold mb-4 text-slate-900">
        Catalog Materials
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-page-surface/80 p-8 rounded-xl shadow w-full max-w-md space-y-4"
      >
        <div>
          <label className="block mb-1 text-slate-700">Materials</label>
          <input
            className="w-full border rounded p-2 bg-page-surface text-slate-900"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-slate-700">Vendors</label>
          <input
            className="w-full border rounded p-2 bg-page-surface text-slate-900"
            value={vendors}
            onChange={(e) => setVendors(e.target.value)}
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            className="bg-muted px-4 py-2 rounded"
            onClick={() => router.push("/onboarding/8-estimates")}
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
  );
}
