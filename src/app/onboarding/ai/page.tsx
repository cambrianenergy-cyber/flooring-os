"use client";

import { authHeaders } from "@/lib/client/authHeader";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
    FormCard,
    useOnboardingState,
} from "../../../components/onboarding/FormCard";
import { useWorkspace } from "../../../lib/workspaceContext";
import OnboardingShell from "../OnboardingShell";

const AGENTS = [
  {
    key: "estimator_ai",
    name: "Estimator AI",
    desc: "Builds estimates, scope, and line items.",
  },
  {
    key: "followup_ai",
    name: "Follow-up AI",
    desc: "Auto follow-ups to increase close rate.",
  },
  {
    key: "scheduler_ai",
    name: "Scheduler AI",
    desc: "Books appointments and confirms timelines.",
  },
  {
    key: "review_ai",
    name: "Review Responder",
    desc: "Responds to reviews professionally.",
  },
] as const;

type Tone = "professional" | "friendly" | "firm";

function ToggleRow({
  enabled,
  title,
  desc,
  onToggle,
}: {
  enabled: boolean;
  title: string;
  desc: string;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border p-4">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-slate-600">{desc}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={[
          "rounded-xl px-4 py-2 text-sm border",
          enabled
            ? "bg-slate-900 text-background border-slate-900"
            : "bg-background text-slate-700 border-slate-200",
        ].join(" ")}
      >
        {enabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

export default function AIPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id || "";
  const { data } = useOnboardingState(workspaceId);

  function aiReducer(
    state: { tone: Tone; enabledAgents: string[] },
    action: {
      type: "set";
      value: Partial<{ tone: Tone; enabledAgents: string[] }>;
    },
  ) {
    switch (action.type) {
      case "set":
        return { ...state, ...action.value };
      default:
        return state;
    }
  }
  const [aiState, dispatchAI] = useReducer(aiReducer, {
    tone: "professional",
    enabledAgents: ["estimator_ai", "followup_ai"],
  });
  const tone = aiState.tone;
  const enabledAgents = aiState.enabledAgents;
  const [samplePrompt, setSamplePrompt] = useState(
    "Write a friendly follow-up message for a flooring estimate.",
  );
  const [sampleOutput, setSampleOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const a: Partial<{ tone: Tone; enabledAgents: string[] }> = data.ai || {};
    dispatchAI({
      type: "set",
      value: {
        tone: a.tone ?? "professional",
        enabledAgents: Array.isArray(a.enabledAgents)
          ? a.enabledAgents
          : ["estimator_ai"],
      },
    });
  }, [data]);

  function toggleAgent(k: string) {
    dispatchAI({
      type: "set",
      value: {
        enabledAgents: enabledAgents.includes(k)
          ? enabledAgents.filter((x: string) => x !== k)
          : [...enabledAgents, k],
      },
    });
  }

  const usageSummary = useMemo(() => {
    // placeholder — later read entitlements doc and show real caps
    const base = 5000;
    const extra = enabledAgents.length * 1500;
    return {
      monthlyActions: base + extra,
      note: "Estimated cap preview (will match plan entitlements).",
    };
  }, [enabledAgents]);

  function runSample() {
    const toneLead =
      tone === "professional"
        ? "Professional"
        : tone === "friendly"
          ? "Friendly"
          : "Firm but respectful";

    setSampleOutput(
      `${toneLead} sample:\n\nHi! Just checking in to see if you had any questions about the flooring estimate. If you'd like, I can adjust options to fit your budget and timeline. What day works best for a quick call?`,
    );
  }

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  async function save(next: string) {
    if (!workspaceId) return;
    // Validation: require at least one agent and a tone
    if (!tone) {
      setValidationError("Please select a tone style.");
      return;
    }
    if (!enabledAgents || enabledAgents.length === 0) {
      setValidationError("Please enable at least one AI assistant.");
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
        patch: { step: "ai", ai: { tone, enabledAgents } },
      }),
    });
    setBusy(false);
    router.push(next);
  }

  return (
    <OnboardingShell step={6}>
      <div className="rounded-xl border bg-yellow-100 p-3 text-sm mb-4">
        NEW AI PAGE IS RENDERING 197
      </div>
      <div className="text-xs text-slate-500 mb-4">
        workspaceId: <span className="font-mono">{String(workspaceId)}</span>
      </div>
      {validationError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {validationError}
        </div>
      )}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        style={{
          textSizeAdjust: "100%",
          WebkitTextSizeAdjust: "100%",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          maskImage: undefined,
          WebkitMaskImage: undefined,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <FormCard
          title="AI Assistants"
          subtitle="Turn agents on/off and set your tone style."
        >
          <div className="rounded-xl border p-4">
            <div className="text-xs text-slate-500">Tone style</div>
            <select
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              value={tone}
              onChange={(e) =>
                dispatchAI({
                  type: "set",
                  value: { tone: e.target.value as Tone },
                })
              }
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="firm">Firm</option>
            </select>
            <div className="mt-2 text-xs text-slate-500">
              This influences follow-ups, proposals, and review responses.
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {AGENTS.map((a) => (
              <ToggleRow
                key={a.key}
                enabled={enabledAgents.includes(a.key)}
                title={a.name}
                desc={a.desc}
                onToggle={() => toggleAgent(a.key)}
              />
            ))}
          </div>
        </FormCard>

        <div className="space-y-6">
          <FormCard
            title="AI Usage Summary"
            subtitle="Preview of monthly cap + what’s enabled."
          >
            <div className="rounded-xl border bg-slate-50 text-slate-900 p-4">
              <div className="text-sm font-semibold">
                {usageSummary.monthlyActions.toLocaleString()} AI actions /
                month
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {usageSummary.note}
              </div>
            </div>

            <div className="mt-4 rounded-xl border p-4">
              <div className="text-sm font-semibold">Try a sample</div>
              <textarea
                className="mt-2 h-28 w-full rounded-xl border px-3 py-2 text-sm"
                value={samplePrompt}
                onChange={(e) => setSamplePrompt(e.target.value)}
              />
              <button
                type="button"
                onClick={runSample}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm text-background"
              >
                Generate demo
              </button>

              {sampleOutput && (
                <pre className="mt-3 whitespace-pre-wrap rounded-xl border bg-background p-3 text-xs text-slate-700">
                  {sampleOutput}
                </pre>
              )}
            </div>
          </FormCard>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="rounded-xl border px-4 py-2 text-sm"
          onClick={() => router.push("/onboarding/packs")}
        >
          Back
        </button>
        <button
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm text-background disabled:opacity-50"
          disabled={busy}
          onClick={() => save("/onboarding/import")}
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
