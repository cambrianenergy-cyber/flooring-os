"use client";

import { authHeaders } from "@/lib/client/authHeader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import {
    FormCard,
    useOnboardingState,
} from "../../../components/onboarding/FormCard";
import { useWorkspace } from "../../../lib/workspaceContext";
import OnboardingShell from "../OnboardingShell";

export default function SecurityPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const { data } = useOnboardingState(workspaceId);

  function securityReducer(
    state: { twoFAPlanned: boolean; reviewedPermissions: boolean },
    action: {
      type: "set";
      value: Partial<{ twoFAPlanned: boolean; reviewedPermissions: boolean }>;
    },
  ) {
    switch (action.type) {
      case "set":
        return { ...state, ...action.value };
      default:
        return state;
    }
  }
  const [securityState, dispatchSecurity] = useReducer(securityReducer, {
    twoFAPlanned: true,
    reviewedPermissions: false,
  });
  const twoFAPlanned = securityState.twoFAPlanned;
  const reviewedPermissions = securityState.reviewedPermissions;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const s: Partial<{ twoFAPlanned: boolean; reviewedPermissions: boolean }> =
      data.security || {};
    dispatchSecurity({
      type: "set",
      value: {
        twoFAPlanned: Boolean(s.twoFAPlanned ?? true),
        reviewedPermissions: Boolean(s.reviewedPermissions ?? false),
      },
    });
  }, [data]);

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  async function save(next: string) {
    if (!workspaceId) return;
    // Validation: require both 2FA and permissions reviewed
    if (!twoFAPlanned) {
      setValidationError(
        "Please confirm that 2FA is planned for admins/owners.",
      );
      return;
    }
    if (!reviewedPermissions) {
      setValidationError("Please confirm that permissions have been reviewed.");
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
          step: "security",
          security: { twoFAPlanned, reviewedPermissions },
        },
      }),
    });
    setBusy(false);
    router.push(next);
  }

  return (
    <OnboardingShell step={8}>
      {validationError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {validationError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormCard
          title="Security & Compliance"
          subtitle="Lock down your workspace so your team and billing are protected."
        >
          <div className="rounded-2xl border bg-emerald-50 p-5">
            <div className="text-lg font-semibold text-emerald-800">
              Workspace Secure ✅
            </div>
            <div className="mt-1 text-sm text-emerald-700">
              Roles, audit logs, and server-only billing writes are enabled.
            </div>
            <div className="mt-3 text-xs text-emerald-700">
              Optional hardening: enable{" "}
              <span className="font-semibold">Lock Mode</span> to freeze
              sensitive edits during incidents.
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={twoFAPlanned}
                onChange={(e) =>
                  dispatchSecurity({
                    type: "set",
                    value: { twoFAPlanned: e.target.checked },
                  })
                }
                className="mt-1"
              />
              <div>
                <div className="font-semibold">2FA reminder</div>
                <div className="text-sm text-slate-600">
                  Require 2FA for admins/owners for best security.
                </div>
              </div>
            </label>
          </div>

          <div className="mt-3 rounded-xl border p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={reviewedPermissions}
                onChange={(e) =>
                  dispatchSecurity({
                    type: "set",
                    value: { reviewedPermissions: e.target.checked },
                  })
                }
                className="mt-1"
              />
              <div>
                <div className="font-semibold">Permissions reviewed</div>
                <div className="text-sm text-slate-600">
                  Confirm who should be admin vs member.
                </div>
              </div>
            </label>
          </div>

          <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-semibold">Audit logs</div>
            <div className="mt-1 text-slate-600">
              Critical actions are written server-side to immutable audit logs.
            </div>
          </div>
        </FormCard>

        <FormCard
          title="Lock Mode (Founder Only)"
          subtitle="Freeze workflows, invites, and role changes during incidents."
        >
          <div className="rounded-xl border p-4">
            <div className="text-sm text-slate-700">
              Lock Mode can be toggled in Settings by a founder.
            </div>
            <Link
              href="/settings/security"
              className="mt-3 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm text-background"
            >
              Go to Security Settings
            </Link>
            <div className="mt-3 text-xs text-slate-500">
              If your UI uses workspace context, Security Settings will use your
              active workspace automatically.
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-background text-slate-900 p-4">
            <div className="font-semibold">Why this matters</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>• Stops privilege escalation</li>
              <li>• Freezes workflow edits mid-incident</li>
              <li>• Maintains billing integrity</li>
            </ul>
          </div>
        </FormCard>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="rounded-xl border px-4 py-2 text-sm"
          onClick={() => router.push("/onboarding/import")}
        >
          Back
        </button>
        <button
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-background disabled:opacity-50"
          disabled={busy}
          onClick={() => save("/onboarding/review")}
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
