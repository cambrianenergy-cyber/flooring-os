"use client";
import { useWorkflow } from "@/lib/workflow";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";

const PRESETS = [
  { name: "Standard", margin: 20 },
  { name: "Premium", margin: 30 },
  { name: "Custom", margin: 0 },
];

export default function PricingSettingsStep() {
  const [preset, setPreset] = useState(PRESETS[0].name);
  const [margin, setMargin] = useState(PRESETS[0].margin);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setStep, completeStep } = useWorkflow();

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = PRESETS.find((p) => p.name === e.target.value);
    setPreset(e.target.value);
    if (selected && selected.name !== "Custom") {
      setMargin(selected.margin);
    }
  };

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMargin(Number(e.target.value));
    setPreset("Custom");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setStep("Approve");
      completeStep("Approve");
      router.push("/onboarding/5-workflow-packs");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={4}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-slate-100">
        <div className="max-w-lg w-full bg-background text-slate-900 rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Pricing Settings
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Pricing Preset
              </label>
              <select
                className="select select-bordered w-full"
                value={preset}
                onChange={handlePresetChange}
              >
                {PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Margin (%)
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={margin}
                onChange={handleMarginChange}
                min={0}
                max={100}
                step={1}
              />
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
          <OnboardingProgress currentStep={5} />
          <span className="text-xs text-gray-600 block text-center mt-2">
            Step 5 of 9
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
