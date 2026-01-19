"use client";
import React, { useState } from "react";
import { useWorkflow } from "@/lib/workflow";
import OnboardingLayout from "../OnboardingLayout";

import OnboardingProgress from "../OnboardingProgress";
import { useRouter } from "next/navigation";

export default function CompanyProfileStep() {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  // Logo upload not yet implemented
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setStep, completeStep } = useWorkflow();

  // const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setLogo(e.target.files[0]);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // TODO: Upload logo to storage and get URL
      // Placeholder for saving company profile data (replace with actual API/database call)
      // await saveCompanyProfile({ companyName, website, industry });
      setStep("Appointment");
      completeStep("Appointment");
      router.push("/onboarding/2-team-roles");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={1}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">Company Profile</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                className="input input-bordered w-full"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Logo</label>
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                disabled
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
          <OnboardingProgress currentStep={2} totalSteps={9} />
          <span className="text-xs text-muted block text-center mt-2">Step 2 of 9</span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
