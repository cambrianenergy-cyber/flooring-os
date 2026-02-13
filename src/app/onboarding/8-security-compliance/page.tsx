"use client";
import { useWorkflow } from "@/lib/workflow";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";

export default function SecurityComplianceStep() {
  const [lockMode, setLockMode] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [auditLogs, setAuditLogs] = useState(false);
  const [permissions, setPermissions] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setStep, completeStep } = useWorkflow();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setStep("Review");
      completeStep("Review");
      router.push("/onboarding/9-review-launch");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={8}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-slate-100">
        <div className="max-w-lg w-full bg-background text-slate-900 rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Security & Compliance
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={lockMode}
                onChange={(e) => setLockMode(e.target.checked)}
              />
              <label className="text-sm font-medium">Enable Lock Mode</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={twoFA}
                onChange={(e) => setTwoFA(e.target.checked)}
              />
              <label className="text-sm font-medium">Require 2FA</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={auditLogs}
                onChange={(e) => setAuditLogs(e.target.checked)}
              />
              <label className="text-sm font-medium">Enable Audit Logs</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={permissions}
                onChange={(e) => setPermissions(e.target.checked)}
              />
              <label className="text-sm font-medium">
                Advanced Permissions
              </label>
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
          <OnboardingProgress currentStep={9} />
          <span className="text-xs text-gray-600 block text-center mt-2">
            Step 9 of 9
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
