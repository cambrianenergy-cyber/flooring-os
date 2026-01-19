
"use client";
import { useState, useEffect } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import { useRouter } from "next/navigation";

const PLAN_FEATURES = {
  Start: ["1 active job", "Basic estimates", "Job tracking"],
  Scale: ["Up to 5 jobs", "Team management", "Automated reminders"],
  Pro: ["Unlimited jobs", "Advanced analytics", "Priority support"],
};

export default function ExpansionMomentBilling() {
  const router = useRouter();
  // Simulate current usage and plan
  const [currentPlan] = useState("Start");
  const [jobsUsed] = useState(2); // Triggered on second job/estimate/crew
  const [showDashboard, setShowDashboard] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"Scale" | "Pro">("Scale");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // On mount, get workspaceId from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWorkspaceId(window.localStorage.getItem("workspaceId"));
    }
  }, []);

  useEffect(() => {
    if (showDashboard) {
      const timeout = setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [showDashboard, router]);

  if (showDashboard) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground text-center">
          <h1 className="text-xl font-semibold mb-4">Welcome to your business OS!</h1>
          <div className="text-muted mb-2">Taking you to your daily dashboard…</div>
          <button
            className="w-full mt-4 bg-accent text-background rounded-md p-2 font-medium"
            onClick={() => router.push("/dashboard")}
          >
            Next step: Go to dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6 bg-dark-panel shadow text-foreground">
        <h1 className="text-xl font-semibold mb-4 text-foreground">You’re growing fast!</h1>
        <p className="mb-4 text-muted">You’re running more than one job — most contractors upgrade here to stay organized.</p>
        <div className="mb-6">
          <div className="font-semibold mb-1">What you’ve already used:</div>
          <ul className="list-disc ml-6 text-sm">
            <li>2 jobs created</li>
            <li>Estimates sent</li>
            <li>Crew assigned</li>
          </ul>
        </div>
        <div className="mb-6">
          <div className="font-semibold mb-1 flex items-center">What unlocks next:
            <InfoTooltip text="Upgrading unlocks more jobs, team management, and automated reminders. You can always skip and upgrade later." />
          </div>
          <ul className="list-disc ml-6 text-sm">
            {PLAN_FEATURES["Scale"].map(f => (
              <li key={f} className="flex items-center">{f}
                <InfoTooltip text={`Feature: ${f}. Learn more in our help center.`} />
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-6">
          <div className="font-semibold mb-1">Your current plan: <span className="text-accent">{currentPlan}</span></div>
          <div className="text-xs text-muted">Upgrade to Scale or Pro for more power as you grow.</div>
        </div>
        <div className="mb-4">
          <button
            className="w-full border-2 border-accent text-accent bg-background rounded-lg p-3 font-bold mb-4 shadow-sm hover:bg-accent hover:text-background transition expansion-skip-btn"
            onClick={() => setShowDashboard(true)}
            aria-label="Skip upgrade and go to dashboard"
          >
            Skip for now
          </button>
          <label className="block mb-1 font-semibold flex items-center">Choose your upgrade plan:
            <InfoTooltip text="Select a plan to unlock more features. You can change plans later." />
          </label>
          <select
            className="w-full border rounded p-2 mb-2"
            value={selectedPlan}
            onChange={e => setSelectedPlan(e.target.value as "Scale" | "Pro")}
            disabled={upgradeLoading}
            aria-label="Upgrade plan selection"
          >
            <option value="Scale">Scale (Up to 5 jobs, Team management, Automated reminders)</option>
            <option value="Pro">Pro (Unlimited jobs, Advanced analytics, Priority support)</option>
          </select>
          <button
            className="w-full bg-accent text-background rounded-md p-2 font-medium mt-2"
            disabled={upgradeLoading || !workspaceId}
            onClick={async () => {
              setUpgradeLoading(true);
              setUpgradeError(null);
              try {
                if (!workspaceId) throw new Error("Workspace ID not found. Please reload or contact support.");
                const res = await fetch("/api/billing/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ workspaceId, planKey: selectedPlan }),
                });
                const data = await res.json();
                if (data && data.url) {
                  window.location.assign(data.url);
                } else {
                  throw new Error(data.error || "Could not start checkout.");
                }
              } catch (err: any) {
                setUpgradeError(err.message || "Upgrade failed. Try again.");
              } finally {
                setUpgradeLoading(false);
              }
            }}
            aria-label={`Upgrade to ${selectedPlan}`}
          >
            {workspaceId ? (upgradeLoading ? "Redirecting…" : `Upgrade to ${selectedPlan}`) : "Workspace not found"}
          </button>
          <button
            className="w-full mt-2 border border-muted text-muted bg-background rounded-md p-2 font-medium"
            onClick={() => alert('Draft saved! You can return and upgrade later.')}
            aria-label="Save upgrade draft"
          >
            Save draft
          </button>
          {!workspaceId && (
            <div className="text-red-500 text-xs mt-2 text-center">
              Workspace ID not found. Please reload the page or contact support.<br />
              <span className="text-muted">(You can also check your workspace selection in the main app.)</span>
            </div>
          )}
          {upgradeError && <div className="text-red-500 text-xs mt-2 text-center">{upgradeError}</div>}
        </div>
        <div className="text-xs text-muted mt-3 text-center flex flex-col items-center">
          <span>No hard block — you can keep working, but upgrading unlocks more features.</span>
          <span className="mt-2">Your privacy is protected. <InfoTooltip text="We never share your business data with third parties. Billing info is encrypted and handled securely." /></span>
        </div>
      </div>
    </main>
  );
}
