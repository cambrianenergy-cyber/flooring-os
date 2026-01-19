import { useState } from "react";

const PRO_FEATURES = [
  { label: "Advanced analytics", desc: "Visualize trends, margins, and growth." },
  { label: "Multi-crew scheduling", desc: "Assign and coordinate multiple crews per job." },
  { label: "Automation rules", desc: "Set up triggers for reminders, follow-ups, and more." },
  { label: "AI estimate optimization", desc: "Get AI-powered suggestions to maximize win rate and profit." },
];

const ELITE_FEATURES = [
  { label: "Workflow marketplace", desc: "Install and share custom job workflows." },
  { label: "Governance controls", desc: "Set permissions, approvals, and audit trails." },
  { label: "SLA support", desc: "Priority support with service-level guarantees." },
  { label: "Deep analytics", desc: "Drill into every metric, job, and crew." },
  { label: "AI agents in background", desc: "Let AI handle routine tasks and surface insights automatically." },
];

export default function PowerUserPath() {
  const [plan, setPlan] = useState<"Start" | "Scale" | "Pro" | "Elite">("Start");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-dark-surface">
      <div className="w-full max-w-2xl border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Unlock More Power</h1>
        <div className="mb-6">
          <div className="font-semibold mb-2">Your current plan: <span className="text-accent">{plan}</span></div>
          <select className="border rounded p-2" value={plan} onChange={e => setPlan(e.target.value as "Start" | "Scale" | "Pro" | "Elite")}> 
            <option value="Start">Start</option>
            <option value="Scale">Scale</option>
            <option value="Pro">Pro</option>
            <option value="Elite">Elite</option>
          </select>
        </div>
        {plan === "Pro" && (
          <div className="mb-6">
            <div className="font-semibold mb-2">Pro Features</div>
            <ul className="list-disc ml-6 text-sm">
              {PRO_FEATURES.map(f => <li key={f.label}><span className="font-medium">{f.label}:</span> {f.desc}</li>)}
            </ul>
          </div>
        )}
        {plan === "Elite" && (
          <div className="mb-6">
            <div className="font-semibold mb-2">Elite Features</div>
            <ul className="list-disc ml-6 text-sm">
              {ELITE_FEATURES.map(f => <li key={f.label}><span className="font-medium">{f.label}:</span> {f.desc}</li>)}
            </ul>
          </div>
        )}
        {(plan === "Start" || plan === "Scale") && (
          <div className="mb-6 text-center">
            <div className="text-muted mb-2">Upgrade to Pro or Elite to unlock advanced features for growing businesses.</div>
            <button className="bg-accent text-background rounded-md p-2 font-medium">See upgrade options</button>
          </div>
        )}
        <div className="text-xs text-muted text-center mt-4">Features are revealed as you grow. No overwhelm, just value.</div>
      </div>
    </main>
  );
}
