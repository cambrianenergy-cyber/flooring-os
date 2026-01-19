"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentOnboardingStep, isOnboardingComplete } from "@/lib/onboarding";

interface OnboardingGuardProps {
  stepNumber: number;
  children: React.ReactNode;
}

export default function OnboardingGuard({ stepNumber, children }: OnboardingGuardProps) {
  const router = useRouter();

  useEffect(() => {
    async function checkOnboarding() {
      // Check if onboarding is complete
      const complete = await isOnboardingComplete();
      if (complete) {
        router.replace("/app");
        return;
      }
      // Get current onboarding step
      const currentStep = await getCurrentOnboardingStep();
      // Debug log for diagnosing redirects
      // eslint-disable-next-line no-console
      console.log("OnboardingGuard: stepNumber=", stepNumber, "currentStep=", currentStep);
      if (stepNumber > currentStep) {
        // Redirect to current step route
        router.replace(`/onboarding/${currentStep}`);
        return;
      }
      // Otherwise, allow rendering
    }
    checkOnboarding();
  }, [router, stepNumber]);

  return <>{children}</>;
}
