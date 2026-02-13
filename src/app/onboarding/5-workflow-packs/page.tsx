"use client";
import { useWorkflow } from "@/lib/workflow";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";

const WORKFLOW_PACKS = [
  { key: "estimates", name: "Estimates" },
  { key: "leads", name: "Leads" },
  { key: "catalog", name: "Catalog" },
  { key: "jobTracking", name: "Job Tracking" },
  { key: "aiAssist", name: "AI Assistants" },
];

export default function WorkflowPacksStep() {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setStep, completeStep } = useWorkflow();

  const handleToggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setStep("Order Materials");
      completeStep("Order Materials");
      router.push("/onboarding/6-ai-assistants");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={5}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-slate-100">
        <div className="max-w-lg w-full bg-background text-slate-900 rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Workflow Packs
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select workflow packs to install:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WORKFLOW_PACKS.map((pack) => (
                  <label
                    key={pack.key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(pack.key)}
                      onChange={() => handleToggle(pack.key)}
                      className="checkbox"
                    />
                    {pack.name}
                  </label>
                ))}
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
          <OnboardingProgress currentStep={6} />
          <span className="text-xs text-gray-600 block text-center mt-2">
            Step 6 of 9
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
