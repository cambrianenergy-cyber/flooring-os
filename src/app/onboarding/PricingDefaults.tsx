"use client";
import { useState, useEffect } from "react";
import { logOnboardingEvent } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";

export default function PricingDefaults() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
  useEffect(() => { logOnboardingEvent("visited", 6, {}); }, []);
    // Suggestions (demo)
    const laborRateSuggestions = ["45", "50", "60"];
    const markupSuggestions = ["15", "20", "25"];
    const minJobSuggestions = ["500", "750", "1000"];
    const tripFeeSuggestions = ["50", "75", "100"];
    const [showLaborRateSuggestions, setShowLaborRateSuggestions] = useState(false);
    const [showMarkupSuggestions, setShowMarkupSuggestions] = useState(false);
    const [showMinJobSuggestions, setShowMinJobSuggestions] = useState(false);
    const [showTripFeeSuggestions, setShowTripFeeSuggestions] = useState(false);
  const router = useRouter();
  const [laborRate, setLaborRate] = useState("");
  const [markup, setMarkup] = useState("");
  const [minJob, setMinJob] = useState("");
  const [tripFee, setTripFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isValidNumber(val: string) {
    return /^\d+(\.\d{1,2})?$/.test(val) && Number(val) > 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // Validation (optional fields)
    const safeLaborRate = laborRate && isValidNumber(laborRate) ? laborRate : null;
    const safeMarkup = markup && isValidNumber(markup) ? markup : null;
    const safeMinJob = minJob && isValidNumber(minJob) ? minJob : null;
    const safeTripFee = tripFee && isValidNumber(tripFee) ? tripFee : null;
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be signed in to save your pricing defaults.");
        setSaving(false);
        await logOnboardingEvent("error", 6, { error: "Not authenticated" });
        return;
      }
      // Assume workspaceId = user.uid for MVP
      // TODO: Replace with workflowStates path
      await runTransaction(db, async (transaction) => {
        transaction.update(onboardingRef, {
          'data.laborRate': safeLaborRate,
          'data.markup': safeMarkup,
          'data.minJob': safeMinJob,
          'data.tripFee': safeTripFee,
          updatedAt: serverTimestamp(),
          currentStep: 6,
          completedSteps: [1, 2, 3, 4, 5, 6],
        });
      });
      await logOnboardingEvent("saved", 6, { laborRate: safeLaborRate, markup: safeMarkup, minJob: safeMinJob, tripFee: safeTripFee });
    } catch (err: any) {
      console.error("PricingDefaults error:", err);
      let message = "Failed to save. Please check your permissions and try again.";
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        message = "You do not have permission to update onboarding data. Please contact your workspace admin or check your membership status.";
      }
      if (err?.message) {
        message += `\n${err.message}`;
      }
      setError(message);
      await logOnboardingEvent("error", 6, { error: message, details: err });
    } finally {
      setSaving(false);
      router.push("/onboarding/step/7"); // Next onboarding step
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" role="main">
      <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground" aria-label="Pricing Defaults Form">
        <button
          type="button"
          className="mb-4 text-blue-600 underline"
          onClick={() => router.back()}
        >
          Back
        </button>
        <h1 className="text-xl font-semibold mb-4 text-foreground">Pricing Defaults</h1>
        <label className="block mt-2 text-sm">Labor Rate ($/hr)</label>
        <div className="flex items-center mt-2">
          <label htmlFor="laborRate" className="block text-sm">Labor Rate ($/hr)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="Typical labor rates for flooring contractors. Click for suggestions." onClick={() => setShowLaborRateSuggestions(!showLaborRateSuggestions)}>?</span>
        </div>
        <input id="laborRate" className="w-full border rounded-md p-2 mt-1" value={laborRate} onChange={e => setLaborRate(e.target.value)} placeholder="e.g. 45" aria-label="Labor Rate" />
        {showLaborRateSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {laborRateSuggestions.map(l => (
              <li key={l} className="cursor-pointer hover:text-accent" onClick={() => { setLaborRate(l); setShowLaborRateSuggestions(false); }}>{`$${l}/hr`}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {laborRateSuggestions.map(l => (
            <span key={l} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setLaborRate(l)}>{`$${l}/hr`}</span>
          ))}
        </div>
        <label className="block mt-3 text-sm">Markup (%)</label>
        <div className="flex items-center mt-3">
          <label htmlFor="markup" className="block text-sm">Markup (%)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="Markup is the percentage added to your costs. Click for suggestions." onClick={() => setShowMarkupSuggestions(!showMarkupSuggestions)}>?</span>
        </div>
        <input id="markup" className="w-full border rounded-md p-2 mt-1" value={markup} onChange={e => setMarkup(e.target.value)} placeholder="e.g. 20" aria-label="Markup" />
        {showMarkupSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {markupSuggestions.map(m => (
              <li key={m} className="cursor-pointer hover:text-accent" onClick={() => { setMarkup(m); setShowMarkupSuggestions(false); }}>{`${m}%`}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {markupSuggestions.map(m => (
            <span key={m} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setMarkup(m)}>{`${m}%`}</span>
          ))}
        </div>
        <label className="block mt-3 text-sm">Minimum Job ($)</label>
        <div className="flex items-center mt-3">
          <label htmlFor="minJob" className="block text-sm">Minimum Job ($)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="Minimum charge for any job. Click for suggestions." onClick={() => setShowMinJobSuggestions(!showMinJobSuggestions)}>?</span>
        </div>
        <input id="minJob" className="w-full border rounded-md p-2 mt-1" value={minJob} onChange={e => setMinJob(e.target.value)} placeholder="e.g. 500" aria-label="Minimum Job" />
        {showMinJobSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {minJobSuggestions.map(mj => (
              <li key={mj} className="cursor-pointer hover:text-accent" onClick={() => { setMinJob(mj); setShowMinJobSuggestions(false); }}>{`$${mj}`}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {minJobSuggestions.map(mj => (
            <span key={mj} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setMinJob(mj)}>{`$${mj}`}</span>
          ))}
        </div>
        <label className="block mt-3 text-sm">Trip Fee ($)</label>
        <div className="flex items-center mt-3">
          <label htmlFor="tripFee" className="block text-sm">Trip Fee ($)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="Fee for travel to job site. Click for suggestions." onClick={() => setShowTripFeeSuggestions(!showTripFeeSuggestions)}>?</span>
        </div>
        <input id="tripFee" className="w-full border rounded-md p-2 mt-1" value={tripFee} onChange={e => setTripFee(e.target.value)} placeholder="e.g. 50" aria-label="Trip Fee" />
        {showTripFeeSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {tripFeeSuggestions.map(tf => (
              <li key={tf} className="cursor-pointer hover:text-accent" onClick={() => { setTripFee(tf); setShowTripFeeSuggestions(false); }}>{`$${tf}`}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {tripFeeSuggestions.map(tf => (
            <span key={tf} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setTripFee(tf)}>{`$${tf}`}</span>
          ))}
        </div>
        {error && (
          <div className="text-danger mt-2 whitespace-pre-line" role="alert">
            {typeof error === "string" ? error : "An unexpected error occurred."}
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
              // TODO: Replace with workflowStates path
              await updateDoc(onboardingRef, {
                'data.laborRate': laborRate,
                'data.markup': markup,
                'data.minJob': minJob,
                'data.tripFee': tripFee,
                updatedAt: serverTimestamp(),
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
          <span role="note">Your pricing defaults are private and only used for onboarding. <a href="/privacy" className="underline text-accent" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
        </div>
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
              await updateDoc(onboardingRef, {
                updatedAt: serverTimestamp(),
                currentStep: 6,
                completedSteps: [1, 2, 3, 4, 5, 6],
              });
              router.push("/onboarding/step/7");
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
