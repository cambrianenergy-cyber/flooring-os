"use client";
import { useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";

const AI_ASSISTS = [
  {
    label: "Suggested follow-up text",
    example: "Hi [Customer], just checking in to see if you have any questions about your estimate. Let me know if you’d like to discuss next steps!",
  },
  {
    label: "Missed payment reminder draft",
    example: "Hi [Customer], we noticed a payment is outstanding for your recent job. Please let us know if you need any help or an updated invoice.",
  },
  {
    label: "Estimate improvement tip",
    example: "Tip: Adding a breakdown of materials and labor can help customers understand your pricing and build trust.",
  },
];

export default function LightAIIntro() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-xl font-semibold mb-4 text-foreground">AI can help—if you want it</h1>
        <p className="mb-4 text-muted">Optional: Try a gentle assist below. You’re always in control.</p>
        <div className="space-y-3">
          {AI_ASSISTS.map((assist, i) => (
            <div key={assist.label} className="relative">
              <button
                className={`w-full p-3 rounded-md border font-medium text-left transition bg-dark-surface hover:bg-accent hover:text-background ${selected === i ? "ring-2 ring-accent" : ""}`}
                onClick={() => setSelected(i)}
                disabled={selected !== null}
              >
                <span className="flex items-center">
                  {assist.label}
                  <InfoTooltip text="This is an optional AI suggestion. Use it if it helps, or ignore it. We only show tips that save you time or help you win more jobs." />
                </span>
                <div className="text-xs text-muted mt-1">{selected === i ? assist.example : "Click to preview"}</div>
              </button>
            </div>
          ))}
        </div>
        {selected !== null && (
          <>
            <div className="mt-6 p-4 bg-dark-surface rounded shadow text-blue-400 font-bold text-center text-lg">
              {AI_ASSISTS[selected].example}
            </div>
            <button
              className="w-full mt-4 bg-accent text-background rounded-md p-2 font-medium"
              onClick={() => window.location.assign('/onboarding/expansion-moment')}
            >
              Next step: Continue
            </button>
          </>
        )}
      </div>
    </main>
  );
}
