"use client";
import React, { useState } from "react";
import { useWorkflow } from "@/lib/workflow";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";
import { useRouter } from "next/navigation";

const ROLES = ["Owner", "Admin", "Office Manager", "Estimator", "Sales", "Installer", "Other"];

export default function TeamRolesStep() {
  const [team, setTeam] = useState([
    { email: "", role: ROLES[0] }
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleTeamChange = (idx: number, field: string, value: string) => {
    setTeam(prev => prev.map((member, i) => i === idx ? { ...member, [field]: value } : member));
  };

  const handleAddMember = () => {
    setTeam(prev => [...prev, { email: "", role: ROLES[0] }]);
  };

  const handleRemoveMember = (idx: number) => {
    setTeam(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { setStep, completeStep } = useWorkflow();
      setStep("Measure");
      completeStep("Measure");
      router.push("/onboarding/3-stripe-connect");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={2}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">Team & Roles</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {team.map((member, idx) => (
              <div key={idx} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={member.email}
                    onChange={e => handleTeamChange(idx, "email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    className="select select-bordered"
                    value={member.role}
                    onChange={e => handleTeamChange(idx, "role", e.target.value)}
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                {team.length > 1 && (
                  <button type="button" className="btn btn-error btn-xs ml-2" onClick={() => handleRemoveMember(idx)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary w-full" onClick={handleAddMember}>
              + Add Team Member
            </button>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
          <OnboardingProgress currentStep={3} totalSteps={9} />
          <span className="text-xs text-muted block text-center mt-2">Step 3 of 9</span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
