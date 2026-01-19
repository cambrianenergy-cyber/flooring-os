import OnboardingLayout from "../OnboardingLayout";
import OnboardingGuard from "../OnboardingGuard";

export default function WelcomePage() {
  return (
    <OnboardingGuard stepNumber={1}>
      <OnboardingLayout step={1}>
        {/* Main form for Welcome step */}
        <h1 className="text-2xl font-bold mb-4">Welcome to Onboarding</h1>
        <p className="mb-6">Let’s get started with your setup.</p>
        <div className="flex gap-4">
          <button className="bg-muted px-4 py-2 rounded">Back</button>
          <button className="bg-accent text-background px-4 py-2 rounded">Save & Continue</button>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
