"use client";

import { authHeaders } from "@/lib/client/authHeader";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import {
    FormCard,
    useOnboardingState,
} from "../../../components/onboarding/FormCard";
import { useWorkspace } from "../../../lib/workspaceContext";
import OnboardingShell from "../OnboardingShell";

function Toggle({
  value,
  onChange,
  label,
  desc,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-sm text-slate-600">{desc}</div>
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={[
            "rounded-xl border px-4 py-2 text-sm",
            value
              ? "bg-slate-900 text-background border-slate-900"
              : "bg-background text-slate-700 border-slate-200",
          ].join(" ")}
        >
          {value ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}

export default function ImportPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const { data } = useOnboardingState(workspaceId);

  function importReducer(
    state: {
      importCustomers: boolean;
      importEstimates: boolean;
      fileName: string | null;
    },
    action: {
      type: "set";
      value: Partial<{
        importCustomers: boolean;
        importEstimates: boolean;
        fileName: string | null;
      }>;
    },
  ) {
    switch (action.type) {
      case "set":
        return { ...state, ...action.value };
      default:
        return state;
    }
  }
  const [importState, dispatchImport] = useReducer(importReducer, {
    importCustomers: true,
    importEstimates: false,
    fileName: null,
  });
  const importCustomers = importState.importCustomers;
  const importEstimates = importState.importEstimates;
  const fileName = importState.fileName;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const i: Partial<{
      importCustomers: boolean;
      importEstimates: boolean;
      fileName: string | null;
    }> = data.import || {};
    dispatchImport({
      type: "set",
      value: {
        importCustomers: Boolean(i.importCustomers ?? true),
        importEstimates: Boolean(i.importEstimates ?? false),
        fileName: i.fileName ?? null,
      },
    });
  }, [data]);

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  async function save(next: string) {
    if (!workspaceId) return;
    // Validation: require at least one import option or file if import is selected
    if (!importCustomers && !importEstimates) {
      setValidationError("Please select at least one import option.");
      return;
    }
    if ((importCustomers || importEstimates) && !fileName) {
      setValidationError("Please upload a CSV file to import data.");
      return;
    }
    setValidationError(null);
    setBusy(true);
    const headers = await authHeaders();
    await fetch("/api/onboarding/save", {
      method: "POST",
      headers,
      body: JSON.stringify({
        workspaceId,
        patch: {
          step: "import",
          import: { importCustomers, importEstimates, fileName },
        },
      }),
    });
    setBusy(false);
    router.push(next);
  }

  return (
    <OnboardingShell step={7}>
      {validationError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {validationError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormCard
          title="Import Data"
          subtitle="Bring over customers and optional history. You can also do this later."
        >
          <Toggle
            value={importCustomers}
            onChange={(v) =>
              dispatchImport({ type: "set", value: { importCustomers: v } })
            }
            label="Import customers"
            desc="Upload a CSV of customers (name, email/phone, address)."
          />
          <div className="mt-3">
            <Toggle
              value={importEstimates}
              onChange={(v) =>
                dispatchImport({ type: "set", value: { importEstimates: v } })
              }
              label="Import past estimates (optional)"
              desc="Useful for analytics and repeat customers."
            />
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="text-sm font-semibold">Upload CSV</div>
            <div className="mt-1 text-xs text-slate-600">
              You’ll be able to map columns in the import tool next.
            </div>
            <input
              type="file"
              accept=".csv"
              className="mt-3 w-full text-sm"
              onChange={(e) =>
                dispatchImport({
                  type: "set",
                  value: { fileName: e.target.files?.[0]?.name || null },
                })
              }
            />
            {fileName && (
              <div className="mt-2 text-xs text-slate-600">
                Selected: {fileName}
              </div>
            )}
            <button
              type="button"
              disabled
              className="mt-3 rounded-xl border px-4 py-2 text-sm opacity-60"
            >
              Import now (coming next)
            </button>
          </div>
        </FormCard>

        <FormCard
          title="Connect Tools"
          subtitle="Optional integrations to power scheduling and communication."
        >
          <div className="rounded-xl border p-4">
            <div className="font-semibold">Google Calendar</div>
            <div className="text-sm text-slate-600">
              Enable scheduling assistant and appointment tracking.
            </div>
            <button
              disabled
              className="mt-3 rounded-xl border px-4 py-2 text-sm opacity-60"
            >
              Connect Google Calendar (coming next)
            </button>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <div className="font-semibold">Email / Inbox</div>
            <div className="text-sm text-slate-600">
              Centralize leads and customer conversations.
            </div>
            <button
              disabled
              className="mt-3 rounded-xl border px-4 py-2 text-sm opacity-60"
            >
              Connect Email (coming next)
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-600 border">
            These can be enabled later under Settings → Integrations.
          </div>
        </FormCard>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="rounded-xl border px-4 py-2 text-sm"
          onClick={() => router.push("/onboarding/ai")}
        >
          Back
        </button>
        <button
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-background disabled:opacity-50"
          disabled={busy}
          onClick={() => save("/onboarding/security")}
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
