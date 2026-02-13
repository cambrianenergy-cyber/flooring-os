"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  getCurrentOnboardingStep,
  isOnboardingComplete,
} from "@/lib/onboarding"; // <-- keep your real import path
import { routeForStep } from "@/lib/onboardingRoutes";

interface OnboardingGuardProps {
  stepNumber: number;
  children: React.ReactNode;
}

export default function OnboardingGuard({
  stepNumber,
  children,
}: OnboardingGuardProps) {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    async function checkOnboarding() {
      // 1) If complete -> send to app home
      const complete = await isOnboardingComplete();
      if (!alive) return;

      if (complete) {
        router.replace("/app");
        return;
      }

      // 2) Get current step from DB/state
      const currentStep = await getCurrentOnboardingStep();
      if (!alive) return;

      // Debug log (optional)
      // eslint-disable-next-line no-console
      console.log("OnboardingGuard:", { stepNumber, currentStep });

      // 3) If user tries to access a step ahead of currentStep -> redirect to the real route for currentStep
      if (stepNumber > currentStep) {
        router.replace(routeForStep(currentStep));
        return;
      }

      // Otherwise render children
    }

    checkOnboarding();

    return () => {
      alive = false;
    };
  }, [router, stepNumber]);

  return <>{children}</>;
}
