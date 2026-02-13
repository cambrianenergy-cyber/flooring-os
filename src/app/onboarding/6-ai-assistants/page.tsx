"use client";
import { useWorkflow } from "@/lib/workflow";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";

const AI_ASSISTANTS = [
  { key: "bidWriter", name: "Bid Writer" },
  { key: "emailResponder", name: "Email Responder" },
  { key: "jobSummarizer", name: "Job Summarizer" },
  { key: "toneAdjuster", name: "Tone Adjuster" },
];

export default function AiAssistantsStep() {
  const [enabled, setEnabled] = useState<string[]>([]);
  const [tone, setTone] = useState("Professional");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setStep, completeStep } = useWorkflow();

  const handleToggle = (key: string) => {
    setEnabled((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setStep("Install");
      completeStep("Install");
      router.push("/onboarding/7-data-import");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={6}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-slate-100">
        <div className="max-w-lg w-full bg-background text-slate-900 rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">AI Assistants</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enable AI Assistants:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AI_ASSISTANTS.map((ai) => (
                  <label
                    key={ai.key}
                    className="flex items-center gap-2 cursor-pointer"
                    htmlFor={`ai-assistant-${ai.key}`}
                  >
                    <input
                      id={`ai-assistant-${ai.key}`}
                      name="aiAssistants"
                      type="checkbox"
                      checked={enabled.includes(ai.key)}
                      onChange={() => handleToggle(ai.key)}
                      className="checkbox"
                      aria-checked={enabled.includes(ai.key)}
                      value={ai.key}
                    />
                    {ai.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="assistant-tone"
              >
                Assistant Tone
              </label>
              <select
                id="assistant-tone"
                name="assistantTone"
                className="select select-bordered w-full"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                aria-label="Assistant Tone"
              >
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Direct">Direct</option>
                <option value="Custom">Custom</option>
              </select>
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
          <OnboardingProgress currentStep={7} />
          <span className="text-xs text-gray-600 block text-center mt-2">
            Step 7 of 9
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
