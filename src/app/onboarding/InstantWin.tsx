import { useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import ConfettiBurst from "../../components/ConfettiBurst";

const WIN_OPTIONS = [
  {
    label: "Send a professional estimate in 1 click",
    action: "estimate",
    description: "Generate and preview a ready-to-send estimate instantly.",
  },
  {
    label: "Track this job from start to finish",
    action: "timeline",
    description: "See a visual timeline for this job, from kickoff to completion.",
  },
  {
    label: "See projected profit instantly",
    action: "profit",
    description: "Preview your estimated profit for this job, right now.",
  },
];

export default function InstantWin() {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function handleClick(action: string) {
    setSelected(action);
    if (action === "estimate") {
      setResult("✅ Estimate generated! Ready to send to your customer.");
    } else if (action === "timeline") {
      setResult("✅ Job timeline visible! Track every step from start to finish.");
    } else if (action === "profit") {
      setResult("✅ Profit preview: $2,400 projected profit on this job.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-xl font-semibold mb-4 text-foreground flex items-center">Get your instant win
          <InfoTooltip text="Choose an action to see instant value. You can always revisit these features later." />
        </h1>
        <p className="mb-4 text-muted">Choose one to see real value, instantly:</p>
        <div className="space-y-3">
          {WIN_OPTIONS.map(opt => (
            <button
              key={opt.action}
              className={`w-full p-3 rounded-md border font-medium text-left transition bg-dark-surface hover:bg-accent hover:text-background ${selected === opt.action ? "ring-2 ring-accent" : ""}`}
              onClick={() => handleClick(opt.action)}
              disabled={!!result}
              aria-label={`Choose instant win: ${opt.label}`}
            >
              <div className="flex items-center">{opt.label}
                <InfoTooltip text={opt.description} />
              </div>
              <div className="text-xs text-muted mt-1">{opt.description}</div>
            </button>
          ))}
        </div>
        {result && (
          <>
            <ConfettiBurst trigger={!!result} />
            <div className="mt-6 p-4 bg-dark-surface rounded shadow text-green-500 font-bold text-center text-lg" aria-live="polite">{result}</div>
            <button
              className="w-full mt-4 bg-accent text-background rounded-md p-2 font-medium"
              onClick={() => window.location.assign('/onboarding/JobTrackingDay1')}
              aria-label="Next step: Track this job"
            >
              Next step: Track this job
            </button>
            <button
              className="w-full mt-2 border border-muted text-muted bg-background rounded-md p-2 font-medium"
              onClick={() => alert('Win saved! You can revisit this feature anytime.')}
              aria-label="Save instant win"
            >
              Save win
            </button>
          </>
        )}
      <div className="text-xs text-muted mt-3 text-center flex flex-col items-center">
        <span>Your privacy is protected. <InfoTooltip text="We never share your job or win data with third parties. All information is encrypted and handled securely." /></span>
      </div>
    </div>
    </main>
  );
}
