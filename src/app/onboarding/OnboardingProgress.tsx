import React from "react";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export default function OnboardingProgress({ currentStep, totalSteps, stepLabels }: OnboardingProgressProps) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Onboarding Progress</span>
        <span className="text-xs text-muted">Step {currentStep} of {totalSteps}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-accent h-2 rounded-full transition-all onboarding-progress-bar"
          data-width={`${(currentStep / totalSteps) * 100}%`}
        />
      </div>
      {stepLabels && (
        <div className="flex justify-between mt-2 text-xs text-muted">
          {stepLabels.map((label, idx) => (
            <span key={label} className={idx + 1 === currentStep ? "font-bold text-accent" : ""}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
