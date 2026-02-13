"use client";

import { updatePolicies } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Policy = {
  marginFloorPct?: number;
  maxDiscountPct?: number;
  lockdownMode?: boolean;
};

export default function PolicyForm({ policy }: { policy: Policy }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    try {
      await updatePolicies({
        marginFloorPct: String(formData.get("marginFloorPct") || ""),
        maxDiscountPct: String(formData.get("maxDiscountPct") || ""),
        lockdownMode: String(formData.get("lockdownMode") || ""),
        reason: String(formData.get("reason") || ""),
      });
      router.refresh();
      alert("Policies updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
      <div className="text-2xl font-semibold">Policy Engine (Founder)</div>
      <div className="text-sm text-neutral-600">
        Guardrails that prevent margin leaks and risky actions.
      </div>

      <form action={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Margin Floor (%)</div>
            <input
              name="marginFloorPct"
              type="number"
              defaultValue={policy?.marginFloorPct ?? 40}
              className="w-full rounded-2xl border px-3 py-2"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Max Discount (%)</div>
            <input
              name="maxDiscountPct"
              type="number"
              defaultValue={policy?.maxDiscountPct ?? 10}
              className="w-full rounded-2xl border px-3 py-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            name="lockdownMode"
            type="checkbox"
            defaultChecked={!!policy?.lockdownMode}
          />
          <span className="text-sm">
            Lockdown Mode (pause sensitive actions: approvals, deletions, major
            edits)
          </span>
        </label>

        <label className="space-y-1 block">
          <div className="text-sm font-medium">Reason (required)</div>
          <input
            name="reason"
            placeholder="Why are we changing policy right now?"
            required
            className="w-full rounded-2xl border px-3 py-2"
          />
        </label>

        <button
          disabled={saving}
          className="rounded-2xl bg-neutral-900 px-5 py-2 text-sm text-neutral-100 hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Policies"}
        </button>
      </form>
    </div>
  );
}
