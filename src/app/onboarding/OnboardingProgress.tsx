import { useRouter } from "next/navigation";
import { ONBOARDING_STEPS } from "./onboardingSteps";

interface OnboardingProgressProps {
  currentStep: number;
}

export default function OnboardingProgress({
  currentStep,
}: OnboardingProgressProps) {
  const router = useRouter();
  const totalSteps = ONBOARDING_STEPS.length;
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Onboarding Progress
        </span>
        <span className="text-xs text-muted">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-accent h-2 rounded-full transition-all onboarding-progress-bar"
          data-width={`${(currentStep / totalSteps) * 100}%`}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted">
        {ONBOARDING_STEPS.map((step, idx) => (
          <button
            key={step.label}
            className={
              (idx + 1 === currentStep
                ? "font-bold text-accent underline"
                : "hover:underline") +
              " bg-transparent border-none p-0 m-0 cursor-pointer text-inherit"
            }
            style={{ background: "none", border: "none" }}
            onClick={() => router.push(step.route)}
            type="button"
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}
