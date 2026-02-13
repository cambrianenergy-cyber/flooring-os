"use client";
import { db } from "@/lib/firebase";
import { useWorkspace } from "@/lib/workspaceContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingLayout from "../OnboardingLayout";

export default function ServicesPage() {
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const [services, setServices] = useState("");
  const [addons, setAddons] = useState("");

  useEffect(() => {
    if (!workspaceId) return;
    const fetchData = async () => {
      try {
        const ref = doc(db, "workspaces", workspaceId, "onboarding", "state");
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().servicesStep) {
          const { services, addons } = snap.data().servicesStep;
          if (services) setServices(services);
          if (addons) setAddons(addons);
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
          servicesStep: { services, addons },
          step: "services",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      router.push("/onboarding/step/6");
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err && "message" in err
          ? (err as { message?: string }).message ||
            "Failed to save. Try again."
          : "Failed to save. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingLayout step={5}>
      {/* Optionally show workspace add-ons if available from context */}
      <h1 className="text-2xl font-bold mb-4 text-slate-900">Services</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-page-surface/80 p-8 rounded-xl shadow w-full max-w-md space-y-4"
      >
        <div>
          <label className="block mb-1 text-slate-700">Services Offered</label>
          <input
            className="w-full border rounded p-2 bg-page-surface text-slate-900"
            value={services}
            onChange={(e) => setServices(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-slate-700">Add-ons</label>
          <input
            className="w-full border rounded p-2 bg-page-surface text-slate-900"
            value={addons}
            onChange={(e) => setAddons(e.target.value)}
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            className="bg-muted px-4 py-2 rounded"
            onClick={() => router.push("/onboarding/4-team")}
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
