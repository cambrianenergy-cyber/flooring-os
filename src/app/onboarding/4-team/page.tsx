"use client";
import { db } from "@/lib/firebase";
import { useWorkspace } from "@/lib/workspaceContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingLayout from "../OnboardingLayout";

export default function TeamSetupPage() {
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const [members, setMembers] = useState("");
  const [roles, setRoles] = useState("");
  useEffect(() => {
    if (!workspaceId) return;
    const fetchData = async () => {
      try {
        const ref = doc(db, "workspaces", workspaceId, "onboarding", "state");
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().teamSetup) {
          const { members, roles } = snap.data().teamSetup;
          if (members) setMembers(members);
          if (roles) setRoles(roles);
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
          teamSetup: { members, roles },
          step: "team-setup",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      router.push("/onboarding/step/5");
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
    <OnboardingLayout step={4}>
      {/* Optionally show workspace add-ons if available from context */}
      <h1 className="text-2xl font-bold mb-4 text-slate-900">Team Setup</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-page-surface/80 p-8 rounded-xl shadow w-full max-w-md space-y-4"
      >
        <div>
          <label htmlFor="team-members" className="block mb-1 text-slate-700">
            Team Members
          </label>
          <input
            id="team-members"
            name="team-members"
            className="w-full border rounded p-2 bg-page-surface text-slate-900"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="roles" className="block mb-1 text-slate-700">
            Roles
          </label>
          <input
            id="roles"
            name="roles"
            className="w-full border rounded p-2 bg-page-surface text-slate-900"
            value={roles}
            onChange={(e) => setRoles(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            className="bg-muted px-4 py-2 rounded"
            onClick={() => router.push("/onboarding/3-service-area")}
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
