"use client";
import { useState, useEffect } from "react";
import { logOnboardingEvent } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import OnboardingProgress from "./OnboardingProgress";

export default function TeamSetup() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
  useEffect(() => { logOnboardingEvent("visited", 4, {}); }, []);
    // Member email suggestions (demo)
    const memberSuggestions = ["owner@email.com", "admin@email.com", "sales@email.com"];
    const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);

    // Role suggestions (demo)
    const roleSuggestions = ["owner", "admin", "sales", "installer"];
    const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);

    // Invite preview (move inside render)
  const router = useRouter();
  const [members, setMembers] = useState("");
  const [roles, setRoles] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isValidEmail(email: string) {
    return /.+@.+\..+/.test(email);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // Validation
    const memberList = members.split(/[\,\s]+/).filter(Boolean);
    const roleList = roles.split(/[\,\s]+/).filter(Boolean);
    if (!memberList.length || !roleList.length) {
      setError("At least one member and one role are required.");
      setSaving(false);
      return;
    }
    if (!memberList.every(isValidEmail)) {
      setError("All member emails must be valid.");
      setSaving(false);
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not authenticated");
        setSaving(false);
        await logOnboardingEvent("error", 4, { error: "Not authenticated" });
        return;
      }
      // Assume workspaceId = user.uid for MVP
      // TODO: Replace with workflowStates path
      await runTransaction(db, async (transaction) => {
        transaction.update(onboardingRef, {
          'data.members': memberList,
          'data.roles': roleList,
          updatedAt: serverTimestamp(),
          currentStep: 4,
          completedSteps: [1, 2, 3, 4],
        });
      });
      await logOnboardingEvent("saved", 4, { members: memberList, roles: roleList });
      router.push("/onboarding/step/5"); // Next onboarding step
    } catch (err) {
      let message = "Failed to save. Please try again.";
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message += `\n${(err as { message: string }).message}`;
      }
      setError(message);
      await logOnboardingEvent("error", 4, { error: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" role="main">
      <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground" aria-label="Team Setup Form">
        <OnboardingProgress currentStep={4} totalSteps={10} stepLabels={["Welcome","Company Profile","Service Area","Team Setup","Trade Types","Pricing Defaults","Lead Intake","Estimate Workflow","Catalog","Integrations"]} />
        <h1 className="text-xl font-semibold mb-4 text-foreground">Team Setup</h1>
        <label className="block mt-2 text-sm">Invite Members (emails, comma or space separated)</label>
        <div className="flex items-center mt-2">
          <label htmlFor="members" className="block text-sm">Invite Members (emails, comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="Enter emails to invite team members. Click for suggestions." onClick={() => setShowMemberSuggestions(!showMemberSuggestions)}>?</span>
        </div>
        <input id="members" className="w-full border rounded-md p-2 mt-1" value={members} onChange={e => setMembers(e.target.value)} placeholder="user1@email.com, user2@email.com" aria-label="Invite Members" />
        {showMemberSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {memberSuggestions.map(m => (
              <li key={m} className="cursor-pointer hover:text-accent" onClick={() => { setMembers(members ? members + ", " + m : m); setShowMemberSuggestions(false); }}>{m}</li>
            ))}
          </ul>
        )}
        {/* Invite preview */}
        {members.split(/[\,\s]+/).filter(Boolean).length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">Inviting: {members.split(/[\,\s]+/).filter(Boolean).join(", ")}</div>
        )}
        <label className="block mt-3 text-sm">Roles (comma or space separated)</label>
        <div className="flex items-center mt-3">
          <label htmlFor="roles" className="block text-sm">Roles (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="Assign roles to your team. Click for suggestions." onClick={() => setShowRoleSuggestions(!showRoleSuggestions)}>?</span>
        </div>
        <input id="roles" className="w-full border rounded-md p-2 mt-1" value={roles} onChange={e => setRoles(e.target.value)} placeholder="owner, admin, sales, ..." aria-label="Roles" />
        {showRoleSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {roleSuggestions.map(r => (
              <li key={r} className="cursor-pointer hover:text-accent" onClick={() => { setRoles(roles ? roles + ", " + r : r); setShowRoleSuggestions(false); }}>{r}</li>
            ))}
          </ul>
        )}
        {error && (
          <div className="text-danger mt-2 whitespace-pre-line" role="alert">
            {error}
            <button
              type="button"
              className="ml-2 underline text-accent"
              onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
              disabled={saving}
              aria-label="Retry"
            >
              Retry
            </button>
          </div>
        )}
        <button className="w-full mt-5 bg-accent text-background rounded-md p-2 font-medium" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save & Continue"}
        </button>
        <button
          type="button"
          className="w-full mt-2 bg-muted text-background rounded-md p-2 font-medium"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              const user = auth.currentUser;
              if (!user) {
                setError("Not authenticated");
                setSaving(false);
                return;
              }
              const memberList = members.split(/[\,\s]+/).filter(Boolean);
              const roleList = roles.split(/[\,\s]+/).filter(Boolean);
              // TODO: Replace with workflowStates path
              await runTransaction(db, async (transaction) => {
                transaction.update(onboardingRef, {
                  'data.members': memberList,
                  'data.roles': roleList,
                  updatedAt: serverTimestamp(),
                });
              });
            } catch (err) {
              let message = "Failed to save draft. Please try again.";
              if (
                typeof err === "object" &&
                err !== null &&
                "message" in err &&
                typeof (err as { message?: unknown }).message === "string"
              ) {
                message += `\n${(err as { message: string }).message}`;
              }
              setError(message);
            } finally {
              setSaving(false);
            }
          }}
          aria-label="Save Draft"
        >
          Save Draft
        </button>
        <div className="mt-4 text-xs text-muted-foreground" aria-live="polite">
          <span role="note">Your team information is private and only used for onboarding. <a href="/privacy" className="underline text-accent" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
        </div>
      </form>
    </main>
  );
}
