"use client";

import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormCard } from "../../../components/onboarding/FormCard";
import { db } from "../../../lib/firebase";
import { useWorkspace } from "../../../lib/workspaceContext";
import OnboardingShell from "../OnboardingShell";

export default function TeamMemberOnboardingPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const workspaceId = workspace?.id;
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!workspaceId || !user?.uid || !name.trim()) {
      setError("Workspace, user, and name are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setDoc(
        doc(db, "workspaces", workspaceId, "members", user.uid),
        {
          name,
          role,
          joinedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      setBusy(false);
      router.push("/dashboard");
    } catch {
      setBusy(false);
      setError("Failed to save. Try again.");
    }
  }

  return (
    <OnboardingShell step={4}>
      <FormCard
        title={
          <span className="text-2xl font-bold text-slate-900">
            Welcome, Team Member
          </span>
        }
        subtitle={
          <span className="text-slate-600">
            Please enter your details to join the workspace.
          </span>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Full Name
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-base bg-background text-foreground focus:ring-2 focus:ring-blue-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Role
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-base bg-background text-foreground focus:ring-2 focus:ring-blue-400"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            className="rounded-lg bg-blue-700 px-8 py-3 text-base font-semibold text-background shadow-md hover:bg-blue-800 transition disabled:opacity-50"
            disabled={busy || !name.trim()}
            onClick={save}
          >
            {busy ? "Saving…" : "Join Workspace"}
          </button>
        </div>
      </FormCard>
    </OnboardingShell>
  );
}
