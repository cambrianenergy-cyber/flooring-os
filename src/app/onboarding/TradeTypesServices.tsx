"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import OnboardingProgress from "./OnboardingProgress";

export default function TradeTypesServices() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
    // Flooring type suggestions (demo)
    const flooringTypeSuggestions = ["Laminate", "Tile", "Hardwood", "Vinyl", "Carpet"];
    const [showFlooringSuggestions, setShowFlooringSuggestions] = useState(false);

    // Add-on suggestions (demo)
    const addOnSuggestions = ["Demo", "Baseboards", "Stairs", "Moisture Barrier"];
    const [showAddOnSuggestions, setShowAddOnSuggestions] = useState(false);

    // Labor category suggestions (demo)
    const laborCategorySuggestions = ["Installer", "Helper", "Supervisor", "Estimator"];
    const [showLaborSuggestions, setShowLaborSuggestions] = useState(false);
  const router = useRouter();
  const [flooringTypes, setFlooringTypes] = useState("");
  const [addOns, setAddOns] = useState("");
  const [laborCategories, setLaborCategories] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // Optional fields
    const flooringList = flooringTypes ? flooringTypes.split(/[,s]+/).filter(Boolean) : null;
    const addOnList = addOns ? addOns.split(/[,s]+/).filter(Boolean) : null;
    const laborList = laborCategories ? laborCategories.split(/[,s]+/).filter(Boolean) : null;
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
          'data.flooringTypes': flooringList,
          'data.addOns': addOnList,
          'data.laborCategories': laborList,
          updatedAt: serverTimestamp(),
          currentStep: 5,
          completedSteps: [1, 2, 3, 4, 5],
        });
      });
      router.push("/onboarding/step/6"); // Next onboarding step
    } catch {
      const message = "Failed to save. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
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
        currentStep: 5,
        completedSteps: [1, 2, 3, 4, 5],
      });
      router.push("/onboarding/step/6");
    } catch {
      setError("Failed to skip. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Accessibility: aria-labels, roles, and tooltips
  // Save draft functionality
  async function handleSaveDraft() {
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
        'data.flooringTypes': flooringTypes ? flooringTypes.split(/[,\s]+/).filter(Boolean) : null,
        'data.addOns': addOns ? addOns.split(/[,\s]+/).filter(Boolean) : null,
        'data.laborCategories': laborCategories ? laborCategories.split(/[,\s]+/).filter(Boolean) : null,
        updatedAt: serverTimestamp(),
      });
    } catch {
      setError("Failed to save draft. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" role="main">
      <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground" aria-label="Trade Types & Services Form">
        <OnboardingProgress
          currentStep={5}
          totalSteps={10}
          stepLabels={["Welcome","Company Profile","Service Area","Team Setup","Trade Types","Pricing Defaults","Lead Intake","Estimate Workflow","Catalog","Integrations"]}
        />
        <h1 className="text-xl font-semibold mb-4 text-foreground">Trade Types & Services</h1>
        <div className="flex items-center mt-2">
          <label htmlFor="flooringTypes" className="block text-sm">Flooring Types (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="List all flooring types you offer, separated by commas or spaces. Click for suggestions." onClick={() => setShowFlooringSuggestions(!showFlooringSuggestions)}>?</span>
        </div>
        <input
          id="flooringTypes"
          className="w-full border rounded-md p-2 mt-1"
          value={flooringTypes}
          onChange={e => setFlooringTypes(e.target.value)}
          placeholder="Laminate, Tile, Hardwood, ..."
          aria-label="Flooring Types"
        />
        {showFlooringSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {flooringTypeSuggestions.map(f => (
              <li key={f} className="cursor-pointer hover:text-accent" onClick={() => { setFlooringTypes(flooringTypes ? flooringTypes + ", " + f : f); setShowFlooringSuggestions(false); }}>{f}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {flooringTypeSuggestions.map(f => (
            <span key={f} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setFlooringTypes(flooringTypes ? flooringTypes + ", " + f : f)}>{f}</span>
          ))}
        </div>
        <div className="flex items-center mt-3">
          <label htmlFor="addOns" className="block text-sm">Add-Ons (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="List any additional services you offer, such as Demo or Baseboards. Click for suggestions." onClick={() => setShowAddOnSuggestions(!showAddOnSuggestions)}>?</span>
        </div>
        <input
          id="addOns"
          className="w-full border rounded-md p-2 mt-1"
          value={addOns}
          onChange={e => setAddOns(e.target.value)}
          placeholder="Demo, Baseboards, ..."
          aria-label="Add-Ons"
        />
        {showAddOnSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {addOnSuggestions.map(a => (
              <li key={a} className="cursor-pointer hover:text-accent" onClick={() => { setAddOns(addOns ? addOns + ", " + a : a); setShowAddOnSuggestions(false); }}>{a}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {addOnSuggestions.map(a => (
            <span key={a} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setAddOns(addOns ? addOns + ", " + a : a)}>{a}</span>
          ))}
        </div>
        <div className="flex items-center mt-3">
          <label htmlFor="laborCategories" className="block text-sm">Labor Categories (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="Specify labor roles, e.g., Installer, Helper. Click for suggestions." onClick={() => setShowLaborSuggestions(!showLaborSuggestions)}>?</span>
        </div>
        <input
          id="laborCategories"
          className="w-full border rounded-md p-2 mt-1"
          value={laborCategories}
          onChange={e => setLaborCategories(e.target.value)}
          placeholder="Installer, Helper, ..."
          aria-label="Labor Categories"
        />
        {showLaborSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {laborCategorySuggestions.map(l => (
              <li key={l} className="cursor-pointer hover:text-accent" onClick={() => { setLaborCategories(laborCategories ? laborCategories + ", " + l : l); setShowLaborSuggestions(false); }}>{l}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {laborCategorySuggestions.map(l => (
            <span key={l} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setLaborCategories(laborCategories ? laborCategories + ", " + l : l)}>{l}</span>
          ))}
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
          onClick={handleSkip}
          aria-label="Skip for now"
        >
          Skip for now
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
          <span role="note">Your information is private and only used for onboarding. <a href="/privacy" className="underline text-accent" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
        </div>
      </form>
    </main>
  );
}
