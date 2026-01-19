"use client";

import { useEffect, useState, useReducer } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../OnboardingShell";
import { FormCard, useOnboardingState } from "../../../components/onboarding/FormCard";
import { useWorkspace } from "../../../lib/workspaceContext";
import { authHeaders } from "@/lib/client/authHeader";

const PACKS = [
  {
    key: "golden_path",
    name: "Contractor Golden Path (Recommended)",
    roi: "Saves ~3–5 hours/week in quoting + follow-up.",
    includes: ["Estimate Builder", "Follow-up Automations", "Deposit Checkout", "Review Requests", "Job Handoff"],
    agents: ["Estimator AI", "Follow-up AI", "Scheduler AI", "Review Responder"],
  },
  {
    key: "commercial_ops",
    name: "Commercial Ops Pack",
    roi: "Standardize bids & approvals across multiple stakeholders.",
    includes: ["RFP Intake", "Bid Approval", "Change Orders", "Invoice Milestones"],
    agents: ["Estimator AI", "Compliance Assistant", "Invoice Assistant"],
  },
  {
    key: "premium_customer",
    name: "Premium Customer Experience Pack",
    roi: "Higher close rate + better reviews.",
    includes: ["Photo Intake", "Proposal Builder", "Upsell Suggestions", "Post-job Check-in"],
    agents: ["Proposal Writer AI", "Review Responder", "Upsell Assistant"],
  },
] as const;

function PackCard({
  active,
  pack,
  onSelect,
}: {
  active: boolean;
  pack: typeof PACKS[number];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={["w-full rounded-2xl border p-5 text-left shadow-sm transition", active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50",].join(" ")}
    >
      <div className="text-lg font-semibold">{pack.name}</div>
      <div className={["mt-1 text-sm", active ? "text-slate-200" : "text-slate-600"].join(" ")}>{pack.roi}</div>

      <div className="mt-4">
        <div className={["text-xs font-semibold", active ? "text-slate-200" : "text-slate-500"].join(" ")}>Includes</div>
        <ul className={["mt-2 space-y-1 text-sm", active ? "text-slate-100" : "text-slate-700"].join(" ")}>
          {pack.includes.map((x) => (
            <li key={x}>• {x}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <div className={["text-xs font-semibold", active ? "text-slate-200" : "text-slate-500"].join(" ")}>Agents</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {pack.agents.map((a) => (
            <span
              key={a}
              className={["rounded-full border px-3 py-1 text-xs", active ? "border-slate-600 text-slate-100" : "border-slate-200 text-slate-700",].join(" ")}
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

export default function PacksPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const { data } = useOnboardingState(workspaceId);

  function packReducer(state: string, action: { type: "set"; value: string }) {
    switch (action.type) {
      case "set":
        return action.value;
      default:
        return state;
    }
  }
  const [selectedPack, dispatchPack] = useReducer(packReducer, "golden_path");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const p: { selectedPack?: string } = data.packs || {};
    dispatchPack({ type: "set", value: p.selectedPack ?? "golden_path" });
  }, [data]);

  async function installPack() {
    // server-only route recommended (entitlement + paywall safe)
    if (!workspaceId) return;
    setBusy(true);
    const headers = await authHeaders();
    await fetch("/api/workflow-packs/install", {
      method: "POST",
      headers,
      body: JSON.stringify({ workspaceId, packKey: selectedPack }),
    });
    setBusy(false);
  }

  async function save(next: string) {
    if (!workspaceId) return;
    setBusy(true);
    const headers = await authHeaders();
    await fetch("/api/onboarding/save", {
      method: "POST",
      headers,
      body: JSON.stringify({
        workspaceId,
        patch: { step: "packs", packs: { selectedPack } },
      }),
    });
    setBusy(false);
    router.push(next);
  }

  return (
    <OnboardingShell step={5}>
      <FormCard title="Workflow Packs" subtitle="Pick your default operating system. You can install more later.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PACKS.map((p) => (
            <PackCard key={p.key} pack={p} active={selectedPack === p.key} onSelect={() => dispatchPack({ type: "set", value: p.key })} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 p-4">
          <div>
            <div className="font-semibold">Install selected pack</div>
            <div className="text-sm text-slate-600">
              Installs workflow definitions + enables recommended automations.
            </div>
          </div>
          <button
            type="button"
            onClick={installPack}
            disabled={busy}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Installing…" : "Install Pack"}
          </button>
        </div>
      </FormCard>

      <div className="flex items-center justify-between">
        <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => router.push("/onboarding/pricing")}>Back</button>
        <button
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-white disabled:opacity-50"
          disabled={busy}
          onClick={() => save("/onboarding/ai")}
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
