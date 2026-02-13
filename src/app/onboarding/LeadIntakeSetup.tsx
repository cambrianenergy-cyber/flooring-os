"use client";

import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/firebase";
import { logOnboardingEvent } from "@/lib/onboarding";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingProgress from "./OnboardingProgress";

export default function LeadIntakeSetup() {
  // TODO: Replace with actual workspaceId from user/session/context
  const { user } = useAuth();
  const workspaceId = user?.uid;
  const onboardingRef = workspaceId
    ? doc(db, "workspaces", workspaceId, "onboarding", "state")
    : null;
  useEffect(() => {
    logOnboardingEvent("visited", 7, {});
  }, []);
  // Lead source suggestions (demo)
  const leadSourceSuggestions = [
    "Website",
    "Angi",
    "Google",
    "Yelp",
    "Referral",
  ];
  const [showLeadSourceSuggestions, setShowLeadSourceSuggestions] =
    useState(false);

  // Contact form validation (demo)
  function isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Phone input masking (demo)
  // In production, use a library like react-input-mask
  const router = useRouter();
  const [leadSources, setLeadSources] = useState("");
  const [contactForm, setContactForm] = useState("");
  const [phoneRouting, setPhoneRouting] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be signed in to save your lead intake settings.");
        setSaving(false);
        await logOnboardingEvent("error", 7, { error: "Not authenticated" });
        return;
      }
      // Assume workspaceId = user.uid for MVP
      // TODO: Replace with workflowStates path
      await runTransaction(db, async (transaction) => {
        if (onboardingRef) {
          transaction.update(onboardingRef, {
            "data.leadSources": leadSources.split(/[\,\s]+/).filter(Boolean),
            "data.contactForm": contactForm,
            "data.phoneRouting": phoneRouting,
            updatedAt: serverTimestamp(),
            currentStep: 7,
            completedSteps: [1, 2, 3, 4, 5, 6, 7],
          });
        }
      });
      await logOnboardingEvent("saved", 7, {
        leadSources,
        contactForm,
        phoneRouting,
      });
      router.push("/onboarding/step/8"); // Next onboarding step
    } catch (err: unknown) {
      console.error("LeadIntakeSetup error:", err);
      let message =
        "Failed to save. Please check your permissions and try again.";
      if (
        typeof err === "object" &&
        err !== null &&
        ("code" in err || "message" in err)
      ) {
        const errorObj = err as { code?: string; message?: string };
        if (
          errorObj.code === "permission-denied" ||
          errorObj.message?.includes("permission")
        ) {
          message =
            "You do not have permission to update onboarding data. Please contact your workspace admin or check your membership status.";
        }
        if (errorObj.message) {
          message += `\n${errorObj.message}`;
        }
      }
      setError(message);
      await logOnboardingEvent("error", 7, { error: message, details: err });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      role="main"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground"
        aria-label="Lead Intake Setup Form"
      >
        <button
          type="button"
          className="mb-4 text-blue-600 underline"
          onClick={() => router.back()}
        >
          Back
        </button>
        <OnboardingProgress currentStep={7} />
        <h1 className="text-xl font-semibold mb-4 text-foreground">
          Lead Intake Setup
        </h1>
        <label className="block mt-2 text-sm">
          Lead Sources (comma or space separated)
        </label>
        <div className="flex items-center mt-2">
          <label htmlFor="leadSources" className="block text-sm">
            Lead Sources (comma or space separated)
          </label>
          <span
            className="ml-2 text-xs text-muted cursor-help"
            title="List all sources where you get leads. Click for suggestions."
            onClick={() =>
              setShowLeadSourceSuggestions(!showLeadSourceSuggestions)
            }
          >
            ?
          </span>
        </div>
        <input
          id="leadSources"
          className="w-full border rounded-md p-2 mt-1"
          value={leadSources}
          onChange={(e) => setLeadSources(e.target.value)}
          placeholder="Website, Angi, Google, ..."
          aria-label="Lead Sources"
        />
        {showLeadSourceSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {leadSourceSuggestions.map((l) => (
              <li
                key={l}
                className="cursor-pointer hover:text-accent"
                onClick={() => {
                  setLeadSources(leadSources ? leadSources + ", " + l : l);
                  setShowLeadSourceSuggestions(false);
                }}
              >
                {l}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {leadSourceSuggestions.map((l) => (
            <span
              key={l}
              className="px-2 py-1 bg-muted rounded text-xs cursor-pointer"
              onClick={() =>
                setLeadSources(leadSources ? leadSources + ", " + l : l)
              }
            >
              {l}
            </span>
          ))}
        </div>
        <label className="block mt-3 text-sm">Contact Form Link</label>
        <div className="flex items-center mt-3">
          <label htmlFor="contactForm" className="block text-sm">
            Contact Form Link
          </label>
          <span
            className="ml-2 text-xs text-muted cursor-help"
            title="Paste a link to your contact form. Must be a valid URL."
          >
            ?
          </span>
        </div>
        <input
          id="contactForm"
          className="w-full border rounded-md p-2 mt-1"
          value={contactForm}
          onChange={(e) => setContactForm(e.target.value)}
          placeholder="https://..."
          aria-label="Contact Form Link"
        />
        {contactForm && !isValidUrl(contactForm) && (
          <div className="text-xs text-danger mt-1">
            Please enter a valid URL.
          </div>
        )}
        <label className="block mt-3 text-sm">Phone Routing</label>
        <div className="flex items-center mt-3">
          <label htmlFor="phoneRouting" className="block text-sm">
            Phone Routing
          </label>
          <span
            className="ml-2 text-xs text-muted cursor-help"
            title="Enter the phone number for lead routing."
          >
            ?
          </span>
        </div>
        <input
          id="phoneRouting"
          className="w-full border rounded-md p-2 mt-1"
          value={phoneRouting}
          onChange={(e) => setPhoneRouting(e.target.value)}
          placeholder="e.g. (555) 123-4567"
          aria-label="Phone Routing"
        />
        {error && (
          <div className="text-danger mt-2 whitespace-pre-line" role="alert">
            {typeof error === "string"
              ? error
              : "An unexpected error occurred."}
            <button
              type="button"
              className="ml-2 underline text-accent"
              onClick={() =>
                handleSubmit({ preventDefault: () => {} } as React.FormEvent)
              }
              disabled={saving}
              aria-label="Retry"
            >
              Retry
            </button>
          </div>
        )}
        {/* ...existing code... */}
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
              await runTransaction(db, async (transaction) => {
                if (onboardingRef) {
                  transaction.update(onboardingRef, {
                    "data.leadSources": leadSources
                      .split(/[\,\s]+/)
                      .filter(Boolean),
                    "data.contactForm": contactForm,
                    "data.phoneRouting": phoneRouting,
                    updatedAt: serverTimestamp(),
                  });
                }
              });
            } catch {
              setError("Failed to save draft. Please try again.");
            } finally {
              setSaving(false);
            }
          }}
          aria-label="Save Draft"
        >
          Save Draft
        </button>
        <div className="mt-4 text-xs text-muted-foreground" aria-live="polite">
          <span role="note">
            Your lead intake settings are private and only used for onboarding.{" "}
            <a
              href="/privacy"
              className="underline text-accent"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </span>
        </div>
      </form>
    </main>
  );
}
