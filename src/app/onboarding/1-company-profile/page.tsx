"use client";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { createWorkspaceDefaults } from "@/lib/firestoreApi";
import { uploadLogo } from "@/lib/uploadLogo";
import { useWorkflow } from "@/lib/workflow";
import { useWorkspace } from "@/lib/workspaceContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";

export default function CompanyProfileStep() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  // Use workspaceId from workspace context if available, else fallback to user?.uid
  const workspaceId = workspace?.id || user?.uid;
  // Prefill form fields from Firestore if available
  useEffect(() => {
    if (!workspaceId) return;
    const fetchData = async () => {
      if (!workspaceId) return;
      try {
        const ref = doc(db, "workspaces", workspaceId, "onboarding", "state");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.companyName) setCompanyName(data.companyName);
          if (data.website) setWebsite(data.website);
          if (data.industry) setIndustry(data.industry);
        }
      } catch {}
    };
    fetchData();
  }, [workspaceId]);
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setStep, completeStep } = useWorkflow();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) {
      setError("Workspace ID is missing.");
      return;
    }
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!website.trim()) {
      setError("Website is required.");
      return;
    }
    if (!industry.trim()) {
      setError("Industry is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let uploadedLogoUrl = logoUrl;
      if (logo) {
        uploadedLogoUrl = await uploadLogo(logo, workspaceId);
        setLogoUrl(uploadedLogoUrl);
      }
      const onboardingRef = doc(
        db,
        "workspaces",
        workspaceId,
        "onboarding",
        "state",
      );
      // Check if onboarding state already exists
      const onboardingSnap = await getDoc(onboardingRef);
      const isFirstTime = !onboardingSnap.exists();
      await setDoc(
        onboardingRef,
        {
          companyName,
          website,
          industry,
          logoUrl: uploadedLogoUrl,
          step: "company-profile",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      // Only create defaults if this is the first onboarding state creation
      if (isFirstTime) {
        await createWorkspaceDefaults(workspaceId);
      }
      setStep("Appointment");
      completeStep("Appointment");
      router.push("/onboarding/step/2");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={1}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-slate-100">
        <div className="max-w-lg w-full bg-background text-slate-900 rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Company Profile
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                className="input input-bordered w-full"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Logo
              </label>
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                onChange={handleLogoChange}
                disabled={loading}
              />
              {logoUrl && (
                <div className="mt-2">
                  <Image
                    src={logoUrl}
                    alt="Company Logo"
                    height={64}
                    width={64}
                    className="object-contain"
                  />
                </div>
              )}
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
          <OnboardingProgress currentStep={2} />
          <span className="text-xs text-gray-600 block text-center mt-2">
            Step 2 of 9
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
