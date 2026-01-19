
"use client";

import React, { useState, useEffect } from "react";
import { logOnboardingEvent } from "@/lib/onboarding";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import OnboardingProgress from "./OnboardingProgress";

export default function CompanyProfile() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
    // Business name autocomplete (demo)
    const businessNameSuggestions = ["Square Flooring", "Floor Pros", "Contractor Co."];
    const [showNameSuggestions, setShowNameSuggestions] = useState(false);

    // Logo preview
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
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
      await runTransaction(db, async (transaction) => {
        transaction.update(onboardingRef, {
          'data.businessName': businessName,
          'data.logoUrl': logoUrl,
          'data.phone': phone,
          'data.address': address,
          updatedAt: serverTimestamp(),
        });
      });
      await logOnboardingEvent("saved", 2, { businessName, logoUrl, phone, address });
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

  function isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function isValidPhone(phone: string) {
    return /^(\+\d{1,2}\s?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(phone);
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
    if (logoUrl && !isValidUrl(logoUrl)) {
      setError("Logo URL must be a valid URL.");
      setSaving(false);
      return;
    }
    if (!phone.trim() || !isValidPhone(phone)) {
      setError("Phone number is required and must be valid.");
      setSaving(false);
      return;
    }
    if (!address.trim()) {
      setError("Address is required.");
      setSaving(false);
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not authenticated");
        setSaving(false);
        return;
      }
      // Assume workspaceId = user.uid for MVP
      // TODO: Replace with workflowStates path
      await runTransaction(db, async (transaction) => {
        transaction.update(onboardingRef, {
          'data.businessName': businessName,
          'data.logoUrl': logoUrl,
          'data.phone': phone,
          'data.address': address,
          updatedAt: serverTimestamp(),
          currentStep: 2,
          completedSteps: [1, 2],
        });
      });
      router.push("/onboarding/step/3"); // Next onboarding step
    } catch (err: unknown) {
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" role="main">
      <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground" aria-label="Company Profile Form">
        <OnboardingProgress currentStep={2} totalSteps={10} stepLabels={["Welcome","Company Profile","Service Area","Team Setup","Trade Types","Pricing Defaults","Lead Intake","Estimate Workflow","Catalog","Integrations"]} />
        <h1 className="text-xl font-semibold mb-4 text-foreground">Company Profile</h1>
        <div className="flex items-center mt-2">
          <label htmlFor="businessName" className="block text-sm">Business Name</label>
          <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Enter your official business name.">?</span>
        </div>
        <input id="businessName" className="w-full border rounded-md p-2 mt-1" value={businessName} onChange={e => setBusinessName(e.target.value)} required aria-label="Business Name" />
                <button
                  type="button"
                  className="ml-2 underline text-xs text-accent"
                  onClick={() => setShowNameSuggestions(!showNameSuggestions)}
                  aria-label="Show business name suggestions"
                >
                  {showNameSuggestions ? "Hide" : "Show"} Suggestions
                </button>
                {showNameSuggestions && (
                  <ul className="mt-1 text-xs bg-muted rounded p-2">
                    {businessNameSuggestions.map(s => (
                      <li key={s} className="cursor-pointer hover:text-accent" onClick={() => { setBusinessName(s); setShowNameSuggestions(false); }}>{s}</li>
                    ))}
                  </ul>
                )}
        <div className="flex items-center mt-3">
          <label htmlFor="logoUrl" className="block text-sm">Logo URL</label>
          <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Paste a link to your logo or upload below.">?</span>
        </div>
        <input id="logoUrl" className="w-full border rounded-md p-2 mt-1" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." aria-label="Logo URL" />
                {logoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <Image
                      src={logoPreview || logoUrl}
                      alt="Logo preview"
                      width={40}
                      height={40}
                      className="rounded border"
                      onError={() => {}}
                    />
                    <span className="text-xs text-muted-foreground">Logo preview</span>
                  </div>
                )}
        <div className="mt-2">
          <label className="block text-xs mb-1" htmlFor="logoUpload">Upload Logo</label>
          <input
            id="logoUpload"
            type="file"
            accept="image/*"
            className="w-full border rounded-md p-2"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = ev => {
                  setLogoPreview(ev.target?.result as string);
                  setLogoUrl(file.name);
                };
                reader.readAsDataURL(file);
              }
            }}
            aria-label="Upload Logo"
          />
        </div>
        <div className="flex items-center mt-3">
          <label htmlFor="industry" className="block text-sm">Industry / Business Type</label>
          <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Select your business type. This helps us tailor features for your workflow.">?</span>
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
          <label htmlFor="phone" className="block text-sm">Phone</label>
          <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Enter a valid business phone number.">?</span>
        </div>
        <input id="phone" className="w-full border rounded-md p-2 mt-1" value={phone} onChange={e => setPhone(e.target.value)} required aria-label="Phone" />
          {/* Phone input masking (demo) */}
          {/* In production, use a library like react-input-mask */}
        <button
          type="button"
          className="ml-2 underline text-accent text-xs mb-2"
          onClick={() => alert('Verification code sent (demo)')}
          aria-label="Verify Phone"
        >
          Verify Phone
        </button>
        <div className="flex items-center mt-3">
          <label htmlFor="address" className="block text-sm">Address</label>
          <span className="ml-2 text-xs text-muted-foreground cursor-help" title="Enter your business address. Autocomplete coming soon.">?</span>
        </div>
        <input
          id="address"
          className="w-full border rounded-md p-2 mt-1"
          value={address}
          onChange={e => setAddress(e.target.value)}
          required
          placeholder="Start typing your address..."
          aria-label="Address"
        />
        <div className="text-xs text-muted-foreground mb-2">(Address autocomplete coming soon. Try typing your business address.)</div>
        <div className="text-xs text-muted-foreground mb-2">(Address autocomplete coming soon)</div>
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
        <button className="w-full mt-5 bg-accent text-background rounded-md p-2 font-medium" type="submit" disabled={saving} aria-label="Save and Continue">
          {saving ? "Saving..." : "Save & Continue"}
        </button>
        <button
          type="button"
          className="w-full mt-2 bg-muted text-background rounded-md p-2 font-medium"
          disabled={saving}
          onClick={handleSaveDraft}
          aria-label="Save Draft"
        >
          Save Draft
        </button>
        <div className="mt-4 text-xs text-muted-foreground" aria-live="polite">
          <span role="note">Your information is private and only used for onboarding. <a href="/privacy" className="underline text-accent" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
        </div>
      </form>
    </main>
  );
}
