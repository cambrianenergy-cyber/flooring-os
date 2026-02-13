"use client";

import { authHeaders } from "@/lib/client/authHeader";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FormCard,
    useOnboardingState,
} from "../../../components/onboarding/FormCard";
import { useWorkspace } from "../../../lib/workspaceContext";
import OnboardingShell from "../OnboardingShell";

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <div className="text-sm">{label}</div>
      <div
        className={[
          "text-sm font-semibold",
          ok ? "text-emerald-700" : "text-slate-500",
        ].join(" ")}
      >
        {ok ? "Ready ✅" : "Missing"}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const { data } = useOnboardingState(workspaceId);

  const [busy, setBusy] = useState(false);

  const checks = useMemo(() => {
    const company: Partial<{ legalName: string; phone: string }> =
      data?.company || {};
    const team: Partial<{ invites: unknown[] }> = data?.team || {};
    const stripe: Partial<{ depositPct: number }> = data?.stripeSetup || {};
    const pricing: Partial<{ laborRate: number; marginPct: number }> =
      data?.pricing || {};
    const packs: Partial<{ selectedPack: string }> = data?.packs || {};
    const ai: Partial<{ enabledAgents: string[] }> = data?.ai || {};

    return {
      company: Boolean(company.legalName && company.phone),
      stripe: typeof stripe.depositPct !== "undefined",
      pricing: Boolean(
        pricing.laborRate && typeof pricing.marginPct !== "undefined",
      ),
      packs: Boolean(packs.selectedPack),
      ai: Array.isArray(ai.enabledAgents) && ai.enabledAgents.length > 0,
      team: Array.isArray(team.invites),
    };
  }, [data]);

  async function runTestEstimate() {
    if (!workspaceId) return;
    setBusy(true);
    const headers = await authHeaders();
    await fetch("/api/estimates/test", {
      method: "POST",
      headers,
      body: JSON.stringify({ workspaceId }),
    });
    setBusy(false);
    alert("Test estimate triggered (wire /api/estimates/test next).");
  }

  async function launch() {
    if (!workspaceId) return;
    setBusy(true);
    const headers = await authHeaders();
    await fetch("/api/onboarding/save", {
      method: "POST",
      headers,
      body: JSON.stringify({
        workspaceId,
        patch: {
          step: "complete",
          completed: true,
          completedAtClient: new Date().toISOString(),
        },
      }),
    });
    setBusy(false);
    router.push("/");
  }

  return (
    <OnboardingShell step={9}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormCard
          title="Review & Launch"
          subtitle="Final checklist before you start running real estimates and payments."
        >
          <div className="space-y-2">
            <Check ok={checks.company} label="Company profile" />
            <Check ok={checks.team} label="Team & roles" />
            <Check ok={checks.stripe} label="Stripe defaults" />
            <Check ok={checks.pricing} label="Pricing engine" />
            <Check ok={checks.packs} label="Workflow pack selected" />
            <Check ok={checks.ai} label="AI assistants enabled" />
          </div>

          <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
            Tip: You can launch even if Stripe isn’t fully connected yet — but
            payments won’t work until it is.
          </div>
        </FormCard>

        <FormCard
          title="Run a Test Flow"
          subtitle="Prove the system works end-to-end."
        >
          <div className="rounded-xl border p-4">
            <div className="font-semibold">Test estimate → checkout</div>
            <div className="mt-1 text-sm text-slate-600">
              Generates a sample estimate using your pricing settings and
              creates a checkout link.
            </div>
            <button
              type="button"
              onClick={runTestEstimate}
              disabled={busy}
              className="mt-3 rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
            >
              Run test estimate (wire route next)
            </button>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="font-semibold">Invite team (final)</div>
            <div className="mt-1 text-sm text-slate-600">
              You can invite from Settings → Team once launched.
            </div>
          </div>

          <button
            type="button"
            onClick={launch}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-background disabled:opacity-50"
          >
            {busy ? "Launching…" : "Launch Square Flooring"}
          </button>
        </FormCard>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="rounded-xl border px-4 py-2 text-sm"
          onClick={() => router.push("/onboarding/security")}
        >
          Back
        </button>
        <button
          className="rounded-xl border px-4 py-2 text-sm"
          onClick={() => router.push("/onboarding/welcome")}
        >
          Restart onboarding
        </button>
      </div>
    </OnboardingShell>
  );
}
