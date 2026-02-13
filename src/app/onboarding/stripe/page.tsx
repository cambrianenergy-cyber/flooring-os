"use client";

import { authHeaders } from "@/lib/client/authHeader";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
    FormCard,
    useOnboardingState,
} from "../../../components/onboarding/FormCard";
import { db } from "../../../lib/firebase";
import { useWorkspace } from "../../../lib/workspaceContext";
import OnboardingShell from "../OnboardingShell";

type StripeStatus = {
  connected?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  accountId?: string;
};

const DEPOSIT_PRESETS = [
  { key: "none", label: "No deposit", pct: 0 },
  { key: "10", label: "10% deposit", pct: 10 },
  { key: "25", label: "25% deposit", pct: 25 },
  { key: "50", label: "50% deposit", pct: 50 },
] as const;

function PresetButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-2 text-sm",
        active
          ? "border-slate-900 bg-slate-900 text-background"
          : "border-slate-200 bg-background text-slate-700 hover:bg-slate-50 text-slate-900",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function StripePage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const { data } = useOnboardingState(workspaceId);

  const [stripe, setStripe] = useState<StripeStatus>({});
  const [state, dispatch] = useReducer(
    (
      prev: { payoutRecipient: string; depositPresetKey: string },
      next: Partial<{ payoutRecipient: string; depositPresetKey: string }>,
    ) => ({ ...prev, ...next }),
    { payoutRecipient: "business_owner", depositPresetKey: "25" },
  );
  const payoutRecipient = state.payoutRecipient;
  const depositPresetKey = state.depositPresetKey;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    // assumes your server writes stripe status doc at: workspaces/{id}/stripe
    const ref = doc(db, "workspaces", workspaceId, "stripe");
    return onSnapshot(ref, (snap) =>
      setStripe(snap.exists() ? (snap.data() as StripeStatus) : {}),
    );
  }, [workspaceId]);

  useEffect(() => {
    if (!data) return;
    const s: { payoutRecipient?: string; depositPresetKey?: string } =
      data.stripeSetup || {};
    dispatch({
      payoutRecipient: s.payoutRecipient ?? "business_owner",
      depositPresetKey: s.depositPresetKey ?? "25",
    });
  }, [data]);

  const depositPct = useMemo(
    () => DEPOSIT_PRESETS.find((d) => d.key === depositPresetKey)?.pct ?? 25,
    [depositPresetKey],
  );

  async function connectStripe() {
    if (!workspaceId) return;
    setBusy(true);
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/connect/start", {
      method: "POST",
      headers,
      body: JSON.stringify({ workspaceId }),
    });
    const json = await res.json();
    setBusy(false);
    if (json?.url) window.location.href = json.url;
  }

  async function syncStripe() {
    if (!workspaceId) return;
    setBusy(true);
    const headers = await authHeaders();
    await fetch("/api/stripe/connect/sync", {
      method: "POST",
      headers,
      body: JSON.stringify({ workspaceId }),
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
        patch: {
          step: "stripe",
          stripeSetup: { payoutRecipient, depositPresetKey, depositPct },
        },
      }),
    });
    setBusy(false);
    router.push(next);
  }

  return (
    <OnboardingShell step={3}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormCard
          title="Connect Stripe"
          subtitle="Enable deposits, invoices, and checkout links for estimates."
        >
          <div className="rounded-xl border p-4">
            <div className="text-sm font-semibold">Connection status</div>
            <div className="mt-2 text-sm text-slate-700">
              {stripe.connected ? "Connected ✅" : "Not connected ❌"}
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-600">
              <div>
                Charges enabled: {String(Boolean(stripe.chargesEnabled))}
              </div>
              <div>
                Payouts enabled: {String(Boolean(stripe.payoutsEnabled))}
              </div>
              {stripe.accountId && <div>Account: {stripe.accountId}</div>}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={connectStripe}
                disabled={busy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-background disabled:opacity-50"
              >
                {busy ? "Working…" : "Connect Stripe"}
              </button>
              <button
                type="button"
                onClick={syncStripe}
                disabled={busy}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
              >
                Sync status
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Best practice: Use Stripe Connect so each workspace collects
              payments into their own account.
            </div>
          </div>
        </FormCard>

        <div className="space-y-6">
          <FormCard
            title="Payouts & Deposit Policy"
            subtitle="Set defaults used in the estimate → checkout flow."
          >
            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">
                Who receives payouts?
              </div>
              <select
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={payoutRecipient}
                onChange={(e) => dispatch({ payoutRecipient: e.target.value })}
              >
                <option value="business_owner">Business owner</option>
                <option value="company_account">Company account</option>
                <option value="finance_manager">Finance manager</option>
              </select>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="text-xs text-slate-500">
                Deposit policy quick picks
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEPOSIT_PRESETS.map((d) => (
                  <PresetButton
                    key={d.key}
                    active={depositPresetKey === d.key}
                    label={d.label}
                    onClick={() => dispatch({ depositPresetKey: d.key })}
                  />
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Default deposit:{" "}
                <span className="font-semibold">{depositPct}%</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="text-sm font-semibold">Optional: Test charge</div>
              <div className="mt-1 text-xs text-slate-600">
                After Stripe is connected, you can run a $1 test charge (dev
                mode).
              </div>
              <button
                type="button"
                disabled
                className="mt-3 rounded-xl border px-4 py-2 text-sm opacity-60"
              >
                Test charge $1 (coming next)
              </button>
            </div>
          </FormCard>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="rounded-xl border px-4 py-2 text-sm"
          onClick={() => router.push("/onboarding/team")}
        >
          Back
        </button>
        <button
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-background disabled:opacity-50"
          disabled={busy}
          onClick={() => save("/onboarding/pricing")}
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
