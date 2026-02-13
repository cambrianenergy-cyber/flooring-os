"use client";
import { useAuth } from "@/hooks/useAuth";

import { auth, db } from "@/lib/firebase";
import { logOnboardingEvent } from "@/lib/onboarding";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function CompanyProfile() {
  // TODO: Replace with actual workspaceId from user/session/context
  const { user } = useAuth();
  const workspaceId = user?.uid;
  const onboardingRef = workspaceId
    ? doc(db, "workspaces", workspaceId, "onboarding", "state")
    : null;
  // Business name autocomplete (demo)
  const businessNameSuggestions = [
    "Square Flooring",
    "Floor Pros",
    "Contractor Co.",
  ];
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [logoUrl] = useState(""); // logoUrl is still used for saving, but setLogoUrl is not needed
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill from auth profile if available
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      if (user.displayName && !businessName) setBusinessName(user.displayName);
      if (user.phoneNumber && !phone) setPhone(user.phoneNumber);
      if (user.email && !address) setAddress(user.email); // Replace with address if available in profile
    }
    logOnboardingEvent("visited", 2, {});
  }, [businessName, phone, address]);

  // Save draft functionality
  async function handleSaveDraft() {
    setSaving(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not authenticated");
        setSaving(false);
        await logOnboardingEvent("error", 2, { error: "Not authenticated" });
        return;
      }
      // TODO: Replace with workflowStates path
      if (!onboardingRef) {
        setError("No onboarding reference found.");
        setSaving(false);
        return;
      }
      await runTransaction(db, async (transaction) => {
        transaction.update(onboardingRef, {
          "data.businessName": businessName,
          "data.logoUrl": logoUrl,
          "data.phone": phone,
          "data.address": address,
          updatedAt: serverTimestamp(),
        });
      });
      await logOnboardingEvent("saved", 2, {
        businessName,
        logoUrl,
        phone,
        address,
      });
    } catch (err: unknown) {
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
      await logOnboardingEvent("error", 2, { error: message });
    } finally {
      setSaving(false);
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // Validation
    if (!businessName.trim()) {
      setError("Business name is required.");
      setSaving(false);
      return;
    }
    try {
      if (!onboardingRef) {
        setError("No workspace ID found.");
        setSaving(false);
        return;
      }
      if (!onboardingRef) {
        setError("No onboarding reference found.");
        setSaving(false);
        return;
      }
      await runTransaction(db, async (transaction) => {
        transaction.update(onboardingRef, {
          businessName,
          logoUrl,
          phone,
          address,
          updatedAt: serverTimestamp(),
          currentStep: 2,
          completedSteps: [1, 2],
        });
      });
      await logOnboardingEvent("saved", 2, {
        businessName,
        logoUrl,
        phone,
        address,
      });
      router.push("/onboarding/step/3");
    } catch (err: unknown) {
      let errorMessage = "Failed to save. Please try again.";
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        errorMessage += `\n${(err as { message: string }).message}`;
      }
      setError(errorMessage);
      await logOnboardingEvent("error", 2, { error: errorMessage });
    } finally {
      setSaving(false);
    }
  }
  // Removed duplicate catch/finally block
  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      role="main"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground"
        aria-label="Company Profile Form"
      >
        {/* ...existing code... */}
        {showNameSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {businessNameSuggestions.map((s) => (
              <li
                key={s}
                className="cursor-pointer hover:text-accent"
                onClick={() => {
                  setBusinessName(s);
                  setShowNameSuggestions(false);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
        {/* ...existing code for logo, industry, phone, address, error, save draft, privacy policy... */}
        <div className="flex items-center mt-3">
          <label htmlFor="industry" className="block text-sm">
            Industry / Business Type
          </label>
          <span
            className="ml-2 text-xs text-muted-foreground cursor-help"
            title="Select your business type. This helps us tailor features for your workflow."
          >
            ?
          </span>
        </div>
        <select
          id="industry"
          className="w-full border rounded-md p-2 mt-1"
          defaultValue="flooring"
          aria-label="Industry / Business Type"
        >
          <option value="flooring">Flooring Contractor</option>
          <option value="general">General Contractor</option>
          <option value="remodel">Remodeler</option>
          <option value="other">Other</option>
        </select>
        <div className="flex items-center mt-3">
          <label htmlFor="phone" className="block text-sm">
            Phone
          </label>
          <span
            className="ml-2 text-xs text-muted-foreground cursor-help"
            title="Enter a valid business phone number."
          >
            ?
          </span>
        </div>
        <input
          id="phone"
          className="w-full border rounded-md p-2 mt-1"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          aria-label="Phone"
        />
        {/* Phone input masking (demo) */}
        {/* In production, use a library like react-input-mask */}
        <button
          type="button"
          className="ml-2 underline text-accent text-xs mb-2"
          onClick={() => alert("Verification code sent (demo)")}
          aria-label="Verify Phone"
        >
          Verify Phone
        </button>
        <div className="flex items-center mt-3">
          <label htmlFor="address" className="block text-sm">
            Address
          </label>
          <span
            className="ml-2 text-xs text-muted-foreground cursor-help"
            title="Enter your business address. Autocomplete coming soon."
          >
            ?
          </span>
        </div>
        <input
          id="address"
          className="w-full border rounded-md p-2 mt-1"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="Start typing your address..."
          aria-label="Address"
        />
        <div className="text-xs text-muted-foreground mb-2">
          (Address autocomplete coming soon. Try typing your business address.)
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          (Address autocomplete coming soon)
        </div>
        {error && (
          <div className="text-danger mt-2 whitespace-pre-line" role="alert">
            {error}
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
        <button
          type="button"
          className="mt-4 w-full bg-accent text-white rounded py-2"
          onClick={handleSaveDraft}
          disabled={saving}
        >
          Save Draft
        </button>
        <div className="mt-4 text-xs text-muted-foreground" aria-live="polite">
          <span role="note">
            Your information is private and only used for onboarding.{" "}
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
