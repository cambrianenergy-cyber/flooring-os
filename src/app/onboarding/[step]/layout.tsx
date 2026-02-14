import OnboardingLayout from "../OnboardingLayout";

export default async function StepLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  
  // Convert step string to number for the layout
  // Handle both numeric strings ('2', '3') and named strings ('welcome', 'step-1')
  let stepNumber = 0;
  if (step === 'welcome') {
    stepNumber = 0;
  } else if (!isNaN(Number(step))) {
    stepNumber = Number(step);
  } else if (step.startsWith('step-')) {
    stepNumber = Number(step.replace('step-', ''));
  }

  return (
    <OnboardingLayout step={stepNumber}>
      {children}
    </OnboardingLayout>
  );
}
