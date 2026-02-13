import OnboardingProgress from "./OnboardingProgress";
import OnboardingNavButtons from "./OnboardingNavButtons";

export default function StepWrapper({ currentStep, children }: { currentStep: number, children: React.ReactNode }) {
  return (
    <>
      <OnboardingProgress currentStep={currentStep} />
      {children}
      <OnboardingNavButtons currentStep={currentStep} />
    </>
  );
}
