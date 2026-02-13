import { useRouter } from "next/navigation";
import { ONBOARDING_STEPS } from "./onboardingSteps";

export default function OnboardingNavButtons({ currentStep }: { currentStep: number }) {
  const router = useRouter();
  const isFirst = currentStep === 1;
  const isLast = currentStep === ONBOARDING_STEPS.length;

  return (
    <div className="flex justify-between mt-6 gap-2">
      <button
        type="button"
        className="bg-muted text-foreground px-4 py-2 rounded disabled:opacity-50"
        onClick={() => router.push(ONBOARDING_STEPS[currentStep - 2]?.route || ONBOARDING_STEPS[0].route)}
        disabled={isFirst}
      >
        ← Back
      </button>
      <button
        type="button"
        className="bg-accent text-background px-4 py-2 rounded disabled:opacity-50"
        onClick={() => router.push(ONBOARDING_STEPS[currentStep]?.route || ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1].route)}
        disabled={isLast}
      >
        {isLast ? "Finish" : "Next →"}
      </button>
    </div>
  );
}
