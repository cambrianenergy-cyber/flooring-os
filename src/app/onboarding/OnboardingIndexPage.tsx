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

  return null;
}
