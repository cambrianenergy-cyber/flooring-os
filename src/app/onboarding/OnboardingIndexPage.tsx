"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import type { WorkspaceOnboarding } from "@/lib/onboarding";

// Type definition for onboarding intake
export type OnboardingIntake = {
  uid: string;
  // Progress tracking
  currentStep:
    | "welcome"
    | "company"
    | "services"
    | "goals"
    | "team"
    | "plan"
    | "commit";
  completedAt?: number; // ms epoch once committed
  workspaceId?: string;
  // Collected data
  company?: {
    legalName: string;
    dba?: string;
    phone: string;
    address: string;
    serviceArea: string;
  };
  services?: string[];
  goals?: string[];
  expectedVolume?: string;
  createdAt: number;
  updatedAt: number;
};


export default function OnboardingIndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    async function redirectToCurrentStep() {
      if (!user) return;
      const workspaceId = user.uid;
      const onboardingDoc = doc(db, "workspaces", workspaceId, "onboarding", "state");
      console.log("Auth user:", user.uid);
      console.log("Workspace ID:", workspaceId);
      console.log("Firestore path:", onboardingDoc.path);
      const snap = await getDoc(onboardingDoc);

      // No onboarding doc yet → start onboarding
      if (!snap.exists()) {
        router.replace("/onboarding/welcome");
        return;
      }

      const onboarding = snap.data() as WorkspaceOnboarding;

      // Onboarding completed → billing or app
      if (onboarding.completedAt) {
        if (onboarding.workspaceId) {
          router.replace(`/billing/activate?workspaceId=${onboarding.workspaceId}`);
        } else {
          router.replace("/onboarding/commit");
        }
        return;
      }

      // Resume onboarding at persisted step
      const step = onboarding.currentStep || "welcome";
      router.replace(`/onboarding/${step}`);
    }

    redirectToCurrentStep();
  }, [user, loading, router]);

  // Show loading state instead of blank page
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-6 text-lg text-slate-700">Preparing your workspace...</p>
      </div>
    </div>
  );
}
