"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../OnboardingShell";
import { FormCard, useOnboardingState } from "../../../components/onboarding/FormCard";
import { useWorkspace } from "../../../lib/workspaceContext";
import { authHeaders } from "@/lib/client/authHeader";

type Rounding = "none" | "nearest_10" | "nearest_50";

const PRESETS = [
  {
    key: "small_shop",
    name: "Small Shop",
    desc: "Lean overhead, fast quoting.",
    values: { laborRate: 65, overheadPct: 12, marginPct: 25, markupPct: 15, depositPct: 25, minDeposit: 250, rounding: "nearest_10" as Rounding },
  },
  {
    key: "premium",
    name: "Premium",
    desc: "Higher margin for premium install experience.",
    values: { laborRate: 85, overheadPct: 18, marginPct: 35, markupPct: 25, depositPct: 35, minDeposit: 500, rounding: "nearest_50" as Rounding },
  },
  {
    key: "commercial",
    name: "Commercial",
    desc: "Volume projects, structured pricing.",
    values: { laborRate: 75, overheadPct: 15, marginPct: 22, markupPct: 12, depositPct: 20, minDeposit: 1000, rounding: "none" as Rounding },
  },
] as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundTotal(total: number, mode: Rounding) {
  if (mode === "none") return total;
  if (mode === "nearest_10") return Math.round(total / 10) * 10;
  if (mode === "nearest_50") return Math.round(total / 50) * 50;
  return total;
}

export default function PricingPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const { data } = useOnboardingState(workspaceId);

  const [state, dispatch] = useReducer(
    (prev: {
      laborRate: number;
      overheadPct: number;
      marginPct: number;
      markupPct: number;
      depositPct: number;
      minDeposit: number;
      rounding: Rounding;
    }, next: Partial<{
      laborRate: number;
      overheadPct: number;
      marginPct: number;
      markupPct: number;
      depositPct: number;
      minDeposit: number;
      rounding: Rounding;
    }>) => ({ ...prev, ...next }),
    {
      laborRate: 75,
      overheadPct: 15,
      marginPct: 25,
      markupPct: 15,
      depositPct: 25,
      minDeposit: 250,
      rounding: "nearest_10",
    }
  );
  const laborRate = state.laborRate;
  const overheadPct = state.overheadPct;
  const marginPct = state.marginPct;
  const markupPct = state.markupPct;
  const depositPct = state.depositPct;
  const minDeposit = state.minDeposit;
  const rounding = state.rounding;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const p: Partial<{
      laborRate: number;
      overheadPct: number;
      marginPct: number;
      markupPct: number;
      depositPct: number;
      minDeposit: number;
      rounding: Rounding;
    }> = data.pricing || {};
    dispatch({
      laborRate: p.laborRate ?? 75,
      overheadPct: p.overheadPct ?? 15,
      marginPct: p.marginPct ?? 25,
      markupPct: p.markupPct ?? 15,
      depositPct: p.depositPct ?? 25,
      minDeposit: p.minDeposit ?? 250,
      rounding: p.rounding ?? "nearest_10",
    });
  }, [data]);

  const preview = useMemo(() => {
    // Example job: $3,200 materials, 24 labor hours
    const materials = 3200;
    const laborHours = 24;

    const labor = laborHours * laborRate;
    const materialsWithMarkup = materials * (1 + markupPct / 100);
    const subtotal = labor + materialsWithMarkup;

    const overhead = subtotal * (overheadPct / 100);
    const preMargin = subtotal + overhead;

    // margin as target profit on top
    const profit = preMargin * (marginPct / 100);
    const total = roundTotal(preMargin + profit, rounding);

    const deposit = Math.max(total * (depositPct / 100), minDeposit);

    return {
      materials,
      laborHours,
      labor,
      materialsWithMarkup,
      overhead,
      profit,
      total,
      deposit,
    };
  }, [laborRate, overheadPct, marginPct, markupPct, depositPct, minDeposit, rounding]);

  function applyPreset(key: string) {
    const p = PRESETS.find((x) => x.key === key);
    if (!p) return;
    dispatch({
      laborRate: p.values.laborRate,
      overheadPct: p.values.overheadPct,
      marginPct: p.values.marginPct,
      markupPct: p.values.markupPct,
      depositPct: p.values.depositPct,
      minDeposit: p.values.minDeposit,
      rounding: p.values.rounding,
    });
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
          step: "pricing",
          pricing: {
            laborRate: clamp(laborRate, 10, 500),
            overheadPct: clamp(overheadPct, 0, 95),
            marginPct: clamp(marginPct, 0, 95),
            markupPct: clamp(markupPct, 0, 95),
            depositPct: clamp(depositPct, 0, 80),
            minDeposit: clamp(minDeposit, 0, 50000),
            rounding,
          },
        },
      }),
    });
    setBusy(false);
    router.push(next);
  }

  return (
    <OnboardingShell step={4}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormCard title="Pricing Settings" subtitle="Set your margin engine defaults. You can override per estimate later.">
          <div className="rounded-xl border p-4">
            <div className="text-sm font-semibold">Preset profiles</div>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className="rounded-xl border px-3 py-2 text-left text-xs hover:bg-slate-50"
                >
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-slate-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Labor rate ($/hr)</div>
              <input
                type="number"
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={laborRate}
                onChange={(e) => dispatch({ laborRate: Number(e.target.value) })}
              />
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Overhead %</div>
              <input
                type="number"
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={overheadPct}
                onChange={(e) => dispatch({ overheadPct: Number(e.target.value) })}
              />
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Target margin %</div>
              <input
                type="number"
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={marginPct}
                onChange={(e) => dispatch({ marginPct: Number(e.target.value) })}
              />
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Material markup %</div>
              <input
                type="number"
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={markupPct}
                onChange={(e) => dispatch({ markupPct: Number(e.target.value) })}
              />
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Deposit %</div>
              <input
                type="number"
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={depositPct}
                onChange={(e) => dispatch({ depositPct: Number(e.target.value) })}
              />
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Minimum deposit ($)</div>
              <input
                type="number"
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={minDeposit}
                onChange={(e) => dispatch({ minDeposit: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="text-xs text-slate-500">Rounding rule</div>
            <select
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              value={rounding}
              onChange={(e) => dispatch({ rounding: e.target.value as Rounding })}
            >
              <option value="none">None</option>
              <option value="nearest_10">Nearest $10</option>
              <option value="nearest_50">Nearest $50</option>
            </select>
          </div>
        </FormCard>

        <FormCard title="Live Preview" subtitle="Example job preview so you can feel the math.">
          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
            Example job: <span className="font-semibold">$3,200 materials</span> +{" "}
            <span className="font-semibold">24 labor hours</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between rounded-xl border p-3">
              <span>Labor</span>
              <span>${preview.labor.toFixed(0)}</span>
            </div>
            <div className="flex justify-between rounded-xl border p-3">
              <span>Materials (with markup)</span>
              <span>${preview.materialsWithMarkup.toFixed(0)}</span>
            </div>
            <div className="flex justify-between rounded-xl border p-3">
              <span>Overhead</span>
              <span>${preview.overhead.toFixed(0)}</span>
            </div>
            <div className="flex justify-between rounded-xl border p-3">
              <span>Profit</span>
              <span>${preview.profit.toFixed(0)}</span>
            </div>
            <div className="flex justify-between rounded-xl border bg-white p-3 font-semibold">
              <span>Total</span>
              <span>${preview.total.toFixed(0)}</span>
            </div>
            <div className="flex justify-between rounded-xl border bg-white p-3 font-semibold">
              <span>Deposit</span>
              <span>${preview.deposit.toFixed(0)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white p-4 text-xs text-slate-500 border">
            This same logic powers your estimate → checkout flow once Stripe is connected.
          </div>
        </FormCard>
      </div>

      <div className="flex items-center justify-between">
        <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => router.push("/onboarding/stripe")}>Back</button>
        <button
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-white disabled:opacity-50"
          disabled={busy}
          onClick={() => save("/onboarding/packs")}
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
