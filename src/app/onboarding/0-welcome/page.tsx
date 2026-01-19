"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useWorkflow } from "@/lib/workflow";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";
import { useRouter } from "next/navigation";

const ACCOUNT_TYPES = ["Owner", "Admin", "Office Manager"];
const COMPANY_TYPES = ["Residential", "Commercial", "Both"];
const GOALS = [
  "Win more bids",
  "Faster estimates",
  "Job tracking",
  "Payments",
  "AI help"
];
const VOLUMES = ["0–10", "10–25", "25–50", "50+ jobs"];
const PATHS = ["Recommended", "Advanced"];

export default function WelcomeStep() {
  const [accountType, setAccountType] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [volume, setVolume] = useState("");
  const [path, setPath] = useState("Recommended");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleGoal(goal: string) {
    setGoals(g => g.includes(goal) ? g.filter(x => x !== goal) : [...g, goal]);
  }

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const { setStep, completeStep } = useWorkflow();
      // Save onboarding step in workflow state
      setStep("Lead");
      completeStep("Lead");
      // Optionally, save onboarding form data to Firestore or context here
      router.push("/onboarding/1-company-profile");
    } catch (err) {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingLayout step={0}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 mt-10">
          <div className="flex flex-col items-center mb-6">
            <Image src="/logo.png" alt="Square Flooring" width={64} height={64} className="h-16 mb-2" />
            <h1 className="text-3xl font-bold mb-1">Welcome to Square Flooring OS</h1>
            <p className="text-muted mb-2">We’re going to set up your company OS</p>
            <OnboardingProgress currentStep={1} totalSteps={9} />
            <span className="text-xs text-muted">Step 1 of 9 &bull; ~6 minutes to finish setup</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Account type</label>
              <select className="w-full border rounded p-2" value={accountType} onChange={e => setAccountType(e.target.value)}>
                <option value="">Select...</option>
                {ACCOUNT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Company type</label>
              <select className="w-full border rounded p-2" value={companyType} onChange={e => setCompanyType(e.target.value)}>
                <option value="">Select...</option>
                {COMPANY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Primary goals</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    className={`px-3 py-1 rounded border ${goals.includes(goal) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                    onClick={() => toggleGoal(goal)}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Expected monthly volume</label>
              <select className="w-full border rounded p-2" value={volume} onChange={e => setVolume(e.target.value)}>
                <option value="">Select...</option>
                {VOLUMES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Guided setup path</label>
              <div className="flex gap-4">
                {PATHS.map(p => (
                  <label key={p} className="flex items-center gap-1">
                    <input type="radio" name="path" value={p} checked={path === p} onChange={() => setPath(p)} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
                onClick={handleStart}
                disabled={loading || !accountType || !companyType || goals.length === 0 || !volume}
              >
                {loading ? "Saving..." : "Start setup"}
              </button>
                          {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
              <button className="text-muted underline text-sm" onClick={() => router.push("/app")}>Skip (not recommended)</button>
            </div>
            <div className="text-xs text-muted mt-2 text-center">You can change everything later.</div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
