
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../OnboardingShell";
import { FormCard } from "../../../components/onboarding/FormCard";
// import { authHeaders } from "@/lib/auth"; // Uncomment and implement as needed
// import { workspace } from "@/lib/workspace"; // Uncomment and implement as needed

const GOALS = [
  { key: "win_more_bids", label: "Win more bids" },
  { key: "grow_team", label: "Grow my team" },
  { key: "streamline_ops", label: "Streamline ops" },
  { key: "increase_profit", label: "Increase profit" },
];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`px-3 py-1 rounded-full border ${active ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function WelcomePage() {
  const [persona, setPersona] = useState("owner");
  const [companyType, setCompanyType] = useState("both");
  const [monthlyVolume, setMonthlyVolume] = useState("10_25");
  const [setupMode, setSetupMode] = useState("recommended");
  const [goals, setGoals] = useState<string[]>(["win_more_bids"]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  // Placeholder for data loading (replace with real data fetching as needed)
  type WelcomeData = {
    persona?: string;
    companyType?: string;
    monthlyVolume?: string;
    setupMode?: string;
    goals?: string[];
  };
  const data: WelcomeData | undefined = undefined;
  // const workspace = { id: "demo-workspace" }; // Replace with real workspace context

  useEffect(() => {
    if (!data) return;
    const d = data as WelcomeData;
    setPersona(d.persona ?? "owner");
    setCompanyType(d.companyType ?? "both");
    setMonthlyVolume(d.monthlyVolume ?? "10_25");
    setSetupMode(d.setupMode ?? "recommended");
    setGoals(Array.isArray(d.goals) ? d.goals : ["win_more_bids"]);
  }, [data]);

  const canContinue = useMemo(() => goals.length >= 1, [goals]);

  function toggleGoal(k: string) {
    setGoals((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  async function save(next: string) {
    // if (!workspace?.id) return;
    setBusy(true);
    // const headers = await authHeaders();
    // await fetch("/api/onboarding/save", {
    //   method: "POST",
    //   headers,
    //   body: JSON.stringify({
    //     workspaceId: workspace?.id,
    //     patch: { step: "welcome", persona, companyType, monthlyVolume, setupMode, goals },
    //   }),
    // });
    setTimeout(() => {
      setBusy(false);
      router.push(next);
    }, 500); // Simulate async
  }

  return (
    <OnboardingShell step={0}>
      <FormCard
        title="Welcome to Square Flooring"
        subtitle="We’re going to set up your company OS — pricing, workflows, AI, and payments — in ~6 minutes."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-slate-500">Account type</div>
            <select className="mt-2 w-full rounded-xl border px-3 py-2 text-sm" value={persona} onChange={(e) => setPersona(e.target.value)}>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="office_manager">Office Manager</option>
            </select>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-slate-500">Company type</div>
            <select className="mt-2 w-full rounded-xl border px-3 py-2 text-sm" value={companyType} onChange={(e) => setCompanyType(e.target.value)}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-slate-500">Expected monthly volume</div>
            <select className="mt-2 w-full rounded-xl border px-3 py-2 text-sm" value={monthlyVolume} onChange={(e) => setMonthlyVolume(e.target.value)}>
              <option value="0_10">0–10 jobs/month</option>
              <option value="10_25">10–25 jobs/month</option>
              <option value="25_50">25–50 jobs/month</option>
              <option value="50_plus">50+ jobs/month</option>
            </select>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-slate-500">Guided setup path</div>
            <select className="mt-2 w-full rounded-xl border px-3 py-2 text-sm" value={setupMode} onChange={(e) => setSetupMode(e.target.value)}>
              <option value="recommended">Recommended (fast)</option>
              <option value="advanced">Advanced (more options)</option>
            </select>
            <div className="mt-2 text-xs text-slate-500">Recommended enables the Contractor Golden Path by default.</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border p-4">
          <div className="text-xs text-slate-500">Primary goals</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip key={g.key} label={g.label} active={goals.includes(g.key)} onClick={() => toggleGoal(g.key)} />
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">Pick at least 1 goal — we tailor defaults around this.</div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            disabled={busy}
            onClick={() => save("/onboarding/review")}
            title="Skip is not recommended"
          >
            Skip (not recommended)
          </button>
          <button
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-white disabled:opacity-50"
            disabled={!canContinue || busy}
            onClick={() => save("/onboarding/company")}
          >
            {busy ? "Saving…" : "Start setup"}
          </button>
        </div>
      </FormCard>
    </OnboardingShell>
  );
}
