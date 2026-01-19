"use client";
import { useState, useEffect } from "react";
import { logOnboardingEvent } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import OnboardingProgress from "./OnboardingProgress";

export default function EstimateWorkflowSetup() {
  // TODO: Replace with actual workspaceId from user/session/context
  const workspaceId = "demo-workspace";
  const onboardingRef = doc(db, "workspaces", workspaceId, "onboarding", "state");
  useEffect(() => { logOnboardingEvent("visited", 8, {}); }, []);
    // Suggestions (demo)
    const templateSuggestions = ["Basic", "Premium", "Custom"];
    const stepSuggestions = ["Measure", "Quote", "Approve", "Schedule"];
    const approvalRuleSuggestions = ["Manager", "Owner", "Admin"];
    const [showTemplateSuggestions, setShowTemplateSuggestions] = useState(false);
    const [showStepSuggestions, setShowStepSuggestions] = useState(false);
    const [showApprovalSuggestions, setShowApprovalSuggestions] = useState(false);
  const router = useRouter();
  const [templates, setTemplates] = useState("");
  const [steps, setSteps] = useState("");
  const [approvalRules, setApprovalRules] = useState("");
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
        await logOnboardingEvent("error", 8, { error: "Not authenticated" });
        return;
      }
      // Assume workspaceId = user.uid for MVP
      // TODO: Replace with workflowStates path
      await runTransaction(db, async (transaction) => {
        transaction.update(onboardingRef, {
          'data.templates': templates.split(/[\,\s]+/).filter(Boolean),
          'data.steps': steps.split(/[\,\s]+/).filter(Boolean),
          'data.approvalRules': approvalRules.split(/[\,\s]+/).filter(Boolean),
          updatedAt: serverTimestamp(),
          currentStep: 8,
          completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
        });
      });
      await logOnboardingEvent("saved", 8, { templates, steps, approvalRules });
      router.push("/onboarding/step/9"); // Next onboarding step
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
      await logOnboardingEvent("error", 8, { error: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" role="main">
      <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground" aria-label="Estimate Workflow Setup Form">
        <OnboardingProgress currentStep={8} totalSteps={10} stepLabels={["Welcome","Company Profile","Service Area","Team Setup","Trade Types","Pricing Defaults","Lead Intake","Estimate Workflow","Catalog","Integrations"]} />
        <h1 className="text-xl font-semibold mb-4 text-foreground">Estimate Workflow Setup</h1>
        <label className="block mt-2 text-sm">Templates (comma or space separated)</label>
        <div className="flex items-center mt-2">
          <label htmlFor="templates" className="block text-sm">Templates (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="List all estimate templates you use. Click for suggestions." onClick={() => setShowTemplateSuggestions(!showTemplateSuggestions)}>?</span>
        </div>
        <input id="templates" className="w-full border rounded-md p-2 mt-1" value={templates} onChange={e => setTemplates(e.target.value)} placeholder="Basic, Premium, ..." aria-label="Templates" />
        {showTemplateSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {templateSuggestions.map(t => (
              <li key={t} className="cursor-pointer hover:text-accent" onClick={() => { setTemplates(templates ? templates + ", " + t : t); setShowTemplateSuggestions(false); }}>{t}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {templateSuggestions.map(t => (
            <span key={t} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setTemplates(templates ? templates + ", " + t : t)}>{t}</span>
          ))}
        </div>
        <label className="block mt-3 text-sm">Steps (comma or space separated)</label>
        <div className="flex items-center mt-3">
          <label htmlFor="steps" className="block text-sm">Steps (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="List all workflow steps. Click for suggestions." onClick={() => setShowStepSuggestions(!showStepSuggestions)}>?</span>
        </div>
        <input id="steps" className="w-full border rounded-md p-2 mt-1" value={steps} onChange={e => setSteps(e.target.value)} placeholder="Measure, Quote, Approve, ..." aria-label="Steps" />
        {showStepSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {stepSuggestions.map(s => (
              <li key={s} className="cursor-pointer hover:text-accent" onClick={() => { setSteps(steps ? steps + ", " + s : s); setShowStepSuggestions(false); }}>{s}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {stepSuggestions.map(s => (
            <span key={s} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setSteps(steps ? steps + ", " + s : s)}>{s}</span>
          ))}
        </div>
        <label className="block mt-3 text-sm">Approval Rules (comma or space separated)</label>
        <div className="flex items-center mt-3">
          <label htmlFor="approvalRules" className="block text-sm">Approval Rules (comma or space separated)</label>
          <span className="ml-2 text-xs text-muted cursor-help" title="List all approval rules. Click for suggestions." onClick={() => setShowApprovalSuggestions(!showApprovalSuggestions)}>?</span>
        </div>
        <input id="approvalRules" className="w-full border rounded-md p-2 mt-1" value={approvalRules} onChange={e => setApprovalRules(e.target.value)} placeholder="Manager, Owner, ..." aria-label="Approval Rules" />
        {showApprovalSuggestions && (
          <ul className="mt-1 text-xs bg-muted rounded p-2">
            {approvalRuleSuggestions.map(a => (
              <li key={a} className="cursor-pointer hover:text-accent" onClick={() => { setApprovalRules(approvalRules ? approvalRules + ", " + a : a); setShowApprovalSuggestions(false); }}>{a}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-1">
          {approvalRuleSuggestions.map(a => (
            <span key={a} className="px-2 py-1 bg-muted rounded text-xs cursor-pointer" onClick={() => setApprovalRules(approvalRules ? approvalRules + ", " + a : a)}>{a}</span>
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
              await runTransaction(db, async (transaction) => {
                transaction.update(onboardingRef, {
                  'data.templates': templates.split(/[\,\s]+/).filter(Boolean),
                  'data.steps': steps.split(/[\,\s]+/).filter(Boolean),
                  'data.approvalRules': approvalRules.split(/[\,\s]+/).filter(Boolean),
                  updatedAt: serverTimestamp(),
                });
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
          <span role="note">Your estimate workflow settings are private and only used for onboarding. <a href="/privacy" className="underline text-accent" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
        </div>
      </form>
    </main>
  );
}
