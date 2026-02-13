"use client";
import { auth, db } from "@/lib/firebase";
import { logOnboardingEvent } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
    doc,
    runTransaction,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

export default function Integrations() {
  // TODO: Replace with actual workspaceId from user/session/context
  const { user } = useAuth();
  const workspaceId = user?.uid;
  const onboardingRef = workspaceId
    ? doc(db, "workspaces", workspaceId, "onboarding", "state")
    : null;
  useEffect(() => {
    logOnboardingEvent("visited", 10, {});
  }, []);
  const router = useRouter();
  const [stripeConnected, setStripeConnected] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
  const [quickbooksConnected, setQuickbooksConnected] = useState(false);
  const [docusignConnected, setDocusignConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not authenticated");
        setSaving(false);
        await logOnboardingEvent("error", 10, { error: "Not authenticated" });
        return;
      }
      // Assume workspaceId = user.uid for MVP
      // TODO: Replace with workflowStates path
      await runTransaction(db, async (transaction) => {
        if (onboardingRef) {
          transaction.update(onboardingRef, {
            "data.stripeConnected": stripeConnected,
            "data.emailConnected": emailConnected,
            "data.quickbooksConnected": quickbooksConnected,
            updatedAt: serverTimestamp(),
            currentStep: 10,
            completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          });
        }
      });
      await logOnboardingEvent("saved", 10, {
        stripeConnected,
        emailConnected,
        quickbooksConnected,
        docusignConnected,
      });
      router.push("/onboarding/step/11"); // Next onboarding step
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
      await logOnboardingEvent("error", 10, { error: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground"
      >
        <h1 className="text-xl font-semibold mb-4 text-foreground">
          Integrations
        </h1>
        <label className="block mt-2 text-sm">Stripe Connected</label>
        <input
          type="checkbox"
          checked={stripeConnected}
          onChange={(e) => setStripeConnected(e.target.checked)}
        />
        <label className="block mt-3 text-sm">Email Connected</label>
        <input
          type="checkbox"
          checked={emailConnected}
          onChange={(e) => setEmailConnected(e.target.checked)}
        />
        <label className="block mt-3 text-sm">
          QuickBooks Connected (optional)
        </label>
        <input
          type="checkbox"
          checked={quickbooksConnected}
          onChange={(e) => setQuickbooksConnected(e.target.checked)}
        />
        <label className="block mt-3 text-sm">
          Docusign Connected (optional)
        </label>
        <input
          type="checkbox"
          checked={docusignConnected}
          onChange={(e) => setDocusignConnected(e.target.checked)}
        />
        {error && (
          <div className="text-danger mt-2 whitespace-pre-line">
            {error}
            <button
              type="button"
              className="ml-2 underline text-accent"
              onClick={() =>
                handleSubmit({ preventDefault: () => {} } as React.FormEvent)
              }
              disabled={saving}
            >
              Retry
            </button>
          </div>
        )}
        <button
          className="w-full mt-5 bg-accent text-background rounded-md p-2 font-medium"
          type="submit"
          disabled={saving}
        >
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
              // TODO: Replace with workflowStates path
              if (onboardingRef) {
                await updateDoc(onboardingRef, {
                  updatedAt: serverTimestamp(),
                  currentStep: 10,
                  completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                });
              }
              router.push("/onboarding/step/11");
            } catch {
              setError("Failed to skip. Please try again.");
            } finally {
              setSaving(false);
            }
          }}
        >
          Skip for now
        </button>
      </form>
    </main>
  );
}
