"use client";
import { useState, useEffect } from "react";
import { logOnboardingEvent } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import OnboardingProgress from "./OnboardingProgress";

export default function ServiceArea() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
  // Log page visit
  useEffect(() => { logOnboardingEvent("visited", 3, {}); }, []);
      // Zip code suggestions (demo)
      const zipSuggestions = ["75001", "75002", "75003"];
      const [showZipSuggestions, setShowZipSuggestions] = useState(false);

      // Radius slider
      const [radiusSlider, setRadiusSlider] = useState(30);

      // County autocomplete (demo)
      const countySuggestions = ["Dallas", "Collin", "Tarrant"];
      const [showCountySuggestions, setShowCountySuggestions] = useState(false);
    // Save draft functionality
    async function handleSaveDraft() {
      setSaving(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not authenticated");
          setSaving(false);
          await logOnboardingEvent("error", 3, { error: "Not authenticated" });
          return;
        }
        // TODO: Replace with workflowStates path
        await runTransaction(db, async (transaction) => {
          transaction.update(onboardingRef, {
            'data.zipCodes': zipCodes.split(/[\,\s]+/).filter(Boolean),
            'data.radius': radius,
            'data.counties': counties.split(/[\,\s]+/).filter(Boolean),
            updatedAt: serverTimestamp(),
          });
        });
        await logOnboardingEvent("saved", 3, { zipCodes, radius, counties });
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
        await logOnboardingEvent("error", 3, { error: message });
      } finally {
        setSaving(false);
      }
    }
  const router = useRouter();
  const [zipCodes, setZipCodes] = useState("");
  const [radius, setRadius] = useState("");
  const [counties, setCounties] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isValidZipList(list: string) {
    return list.split(/[,\s]+/).filter(Boolean).every(z => /^\d{5}$/.test(z));
  }
  function isValidCountyList(list: string) {
    return list.split(/[,\s]+/).filter(Boolean).every(c => /^[A-Za-z\s]+$/.test(c));
  }
  function isValidRadius(val: string) {
    return /^\d+$/.test(val) && Number(val) > 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // Validation
    if (!zipCodes.trim() || !isValidZipList(zipCodes)) {
      setError("Zip codes are required and must be 5-digit numbers.");
      setSaving(false);
      return;
    }
    if (!radius.trim() || !isValidRadius(radius)) {
      setError("Radius is required and must be a positive number.");
      setSaving(false);
      return;
    }
    if (!counties.trim() || !isValidCountyList(counties)) {
      setError("Counties are required and must be alphabetic.");
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
          'data.zipCodes': zipCodes.split(/[,\s]+/).filter(Boolean),
          'data.radius': radius,
          'data.counties': counties.split(/[,\s]+/).filter(Boolean),
          updatedAt: serverTimestamp(),
          currentStep: 3,
          completedSteps: [1, 2, 3],
        });
      });
      router.push("/onboarding/step/4"); // Next onboarding step
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" role="main">
      <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground" aria-label="Service Area Form">
        <OnboardingProgress currentStep={3} totalSteps={10} stepLabels={["Welcome","Company Profile","Service Area","Team Setup","Trade Types","Pricing Defaults","Lead Intake","Estimate Workflow","Catalog","Integrations"]} />
        <h1 className="text-xl font-semibold mb-4 text-foreground">Service Area</h1>
        <div className="flex items-center mt-2">
          <label htmlFor="zipCodes" className="block text-sm">Zip Codes (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="List all zip codes you serve, separated by commas or spaces. Each must be a 5-digit number. Click for suggestions." onClick={() => setShowZipSuggestions(!showZipSuggestions)}>?</span>
        </div>
        <input id="zipCodes" className="w-full border rounded-md p-2 mt-1" value={zipCodes} onChange={e => setZipCodes(e.target.value)} placeholder="75001, 75002, ..." aria-label="Zip Codes" />
                {showZipSuggestions && (
                  <ul className="mt-1 text-xs bg-muted rounded p-2">
                    {zipSuggestions.map(z => (
                      <li key={z} className="cursor-pointer hover:text-accent" onClick={() => { setZipCodes(zipCodes ? zipCodes + ", " + z : z); setShowZipSuggestions(false); }}>{z}</li>
                    ))}
                  </ul>
                )}
        <div className="flex items-center mt-3">
          <label htmlFor="radius" className="block text-sm">Radius (miles)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="Enter the radius in miles from your main location. You can use the slider below for quick selection.">?</span>
        </div>
        <input id="radius" className="w-full border rounded-md p-2 mt-1" value={radius} onChange={e => setRadius(e.target.value)} placeholder="e.g. 30" aria-label="Radius" />
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={radiusSlider}
                  onChange={e => { setRadiusSlider(Number(e.target.value)); setRadius(e.target.value); }}
                  className="w-full mt-2"
                  aria-label="Radius Slider"
                />
                <div className="text-xs text-muted-foreground mb-2">Selected radius: {radiusSlider} miles</div>
        <div className="flex items-center mt-3">
          <label htmlFor="counties" className="block text-sm">Counties (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="List all counties you serve, separated by commas or spaces. Only alphabetic characters allowed. Click for suggestions." onClick={() => setShowCountySuggestions(!showCountySuggestions)}>?</span>
        </div>
        <input id="counties" className="w-full border rounded-md p-2 mt-1" value={counties} onChange={e => setCounties(e.target.value)} placeholder="Dallas, Collin, ..." aria-label="Counties" />
                {showCountySuggestions && (
                  <ul className="mt-1 text-xs bg-muted rounded p-2">
                    {countySuggestions.map(c => (
                      <li key={c} className="cursor-pointer hover:text-accent" onClick={() => { setCounties(counties ? counties + ", " + c : c); setShowCountySuggestions(false); }}>{c}</li>
                    ))}
                  </ul>
                )}
                {/* Map preview placeholder */}
                <div className="mt-4 mb-2 w-full h-32 bg-muted flex items-center justify-center rounded border">
                  <span className="text-muted-foreground text-xs">[Map preview of service area coming soon]</span>
                </div>
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
        <div className="mt-4 text-xs text-muted" aria-live="polite">
          <span role="note">Your service area information is private and only used for onboarding. <a href="/privacy" className="underline text-accent" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
        </div>
      </form>
    </main>
  );
}
