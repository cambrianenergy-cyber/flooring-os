"use client";
import { ONBOARDING_STEPS } from "@/config/onboardingSteps";
import React, { useEffect, useState } from "react";

type FieldOption = { label: string; value: string };
type FieldBase = {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
};
type TextField = FieldBase & { type: "text" | "textarea" };
type SelectField = FieldBase & { type: "select"; options: FieldOption[] };
type MultiSelectField = FieldBase & {
  type: "multiselect";
  options: FieldOption[];
};
type Field = TextField | SelectField | MultiSelectField;
type Step = { label: string; fields: Field[] };
type FormState = Record<string, string | string[]>;

export default function HomePage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      setWorkspaceId(user.uid);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/onboarding?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            cache: "no-store",
          },
        );
        const json = await res.json();
        if (res.ok) {
          setFormState(json?.data ?? {});
          if (typeof json?.data?.progress?.currentStep === "number") {
            setStepIndex(
              Math.max(
                0,
                Math.min(
                  ONBOARDING_STEPS.length - 1,
                  json.data.progress.currentStep,
                ),
              ),
            );
          }
        }
      } finally {
      }
    })();
  }, [workspaceId]);

  const updateField = (name: string, value: string | string[]) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const saveStep = async (nextStepIndex: number) => {
    if (!workspaceId) throw new Error("No workspaceId");
    const patch = {
      ...formState,
      progress: {
        currentStep: nextStepIndex,
        updatedAtMs: Date.now(),
      },
    };
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, data: patch }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Save failed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isLast = stepIndex === ONBOARDING_STEPS.length - 1;
    const nextIndex = isLast ? stepIndex : stepIndex + 1;
    await saveStep(nextIndex);
    if (!isLast) setStepIndex(nextIndex);
  };

  const step = ONBOARDING_STEPS[stepIndex];
  const fields = step?.fields ?? [];
  const hasMissingRequired = fields.some(
    (f) =>
      "required" in f &&
      Boolean(f.required) &&
      (formState[f.name] === undefined || formState[f.name] === ""),
  );

  if (loading) {
    return <div className="text-muted p-6">Loading…</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-700 p-6 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {step?.label}
        </h2>
        <div className="space-y-4">
          {fields.map((field) => {
            const value = formState[field.name] ?? "";
            if (field.type === "textarea") {
              return (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-muted mb-2">
                    {field.label}
                  </label>
                  <textarea
                    value={value}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    className="w-full min-h-[110px] rounded-lg bg-slate-950/60 border border-slate-700 text-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      "placeholder" in field &&
                      typeof field.placeholder === "string"
                        ? field.placeholder
                        : ""
                    }
                  />
                </div>
              );
            }
            if (field.type === "select") {
              return (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-muted mb-2">
                    {field.label}
                  </label>
                  <select
                    value={value}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    className="w-full rounded-lg bg-slate-950/60 border border-slate-700 text-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {"options" in field && Array.isArray(field.options)
                      ? field.options.map((opt) =>
                          typeof opt === "object" &&
                          "value" in opt &&
                          "label" in opt ? (
                            <option
                              key={String(opt.value)}
                              value={String(opt.value)}
                            >
                              {opt.label}
                            </option>
                          ) : null,
                        )
                      : null}
                  </select>
                </div>
              );
            }
            if (field.type === "multiselect") {
              const arr = Array.isArray(formState[field.name])
                ? (formState[field.name] as string[])
                : [];
              return (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-muted mb-2">
                    {field.label}
                  </label>
                  <div className="space-y-2 rounded-lg bg-slate-950/40 border border-slate-700 p-3">
                    {"options" in field && Array.isArray(field.options)
                      ? field.options.map((opt) => {
                          if (
                            typeof opt === "object" &&
                            "value" in opt &&
                            "label" in opt
                          ) {
                            const checked = arr.includes(String(opt.value));
                            return (
                              <label
                                key={String(opt.value)}
                                className="flex items-center gap-2 text-muted"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? arr.filter(
                                          (v) => v !== String(opt.value),
                                        )
                                      : [...arr, String(opt.value)];
                                    updateField(field.name, next);
                                  }}
                                />
                                {opt.label}
                              </label>
                            );
                          }
                          return null;
                        })
                      : null}
                  </div>
                </div>
              );
            }
            return (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-muted mb-2">
                  {field.label}
                </label>
                <input
                  value={value}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-700 text-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    "placeholder" in field &&
                    typeof field.placeholder === "string"
                      ? field.placeholder
                      : ""
                  }
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-8">
          {stepIndex > 0 ? (
            <button
              type="button"
              className="px-6 py-2 rounded-lg bg-slate-800 text-muted border border-slate-700 hover:bg-slate-700"
              onClick={() => setStepIndex((prev) => prev - 1)}
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="submit"
            className="px-8 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-60"
            disabled={hasMissingRequired}
          >
            {stepIndex === ONBOARDING_STEPS.length - 1
              ? "Finish"
              : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
