"use client";
import React, { useState } from "react";
import { useWorkflow } from "@/lib/workflow";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";
import { useRouter } from "next/navigation";

export default function DataImportStep() {
  const [csv, setCsv] = useState<File | null>(null);
  const [calendar, setCalendar] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setStep, completeStep } = useWorkflow();

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsv(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // TODO: Upload CSV to storage and get URL
      setStep("Closeout");
      completeStep("Closeout");
      router.push("/onboarding/8-security-compliance");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={7}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">Data Import</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Import CSV</label>
              <input
                type="file"
                accept=".csv"
                className="file-input file-input-bordered w-full"
                onChange={handleCsvChange}
              />
              {csv && <span className="text-xs text-muted">Selected: {csv.name}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Connect Calendar</label>
              <input
                type="checkbox"
                className="checkbox"
                checked={calendar}
                onChange={e => setCalendar(e.target.checked)}
              />
              <span className="ml-2">Sync with Google Calendar</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Import from Email</label>
              <input
                type="email"
                className="input input-bordered w-full"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
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
          <OnboardingProgress currentStep={8} totalSteps={9} />
          <span className="text-xs text-muted block text-center mt-2">Step 8 of 9</span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
