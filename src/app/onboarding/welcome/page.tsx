"use client";
import { useRouter } from "next/navigation";
import OnboardingLayout from "../OnboardingLayout";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  
  return (
    <OnboardingLayout step={0}>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to SquareOS</h1>
        <p className="text-lg mb-6">
          Let's get your workspace set up. This onboarding will help you configure
          your business settings, team, and tools.
        </p>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">What you'll set up:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Company profile and information</li>
            <li>Service area and coverage</li>
            <li>Team members and roles</li>
            <li>Services and pricing</li>
            <li>Lead intake and estimates</li>
            <li>Product catalog</li>
            <li>Integrations</li>
          </ul>
        </div>
        
        <button
          onClick={() => router.push("/onboarding/2")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Get Started →
        </button>
      </div>
    </OnboardingLayout>
  );
}
