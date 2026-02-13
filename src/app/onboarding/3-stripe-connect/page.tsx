"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";

export default function StripeConnectStep() {
  const [error, setError] = useState("");
  const router = useRouter();

  // Stripe Connect integration coming soon
  const handleConnect = async () => {
    setError("Stripe Connect integration coming soon.");
  };

  const handleContinue = async () => {
    router.push("/onboarding/step/4");
  };

  return (
    <OnboardingLayout step={3}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-slate-100">
        <div className="max-w-lg w-full bg-background text-slate-900 rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Connect Stripe
          </h1>
          <p className="mb-4 text-center">
            Connect your Stripe account to enable payments and payouts.
          </p>
          <div className="flex flex-col items-center mb-4">
            <button
              className="btn btn-secondary mb-2"
              onClick={handleConnect}
              disabled
            >
              Stripe Connect (coming soon)
            </button>
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button className="btn btn-primary w-full" onClick={handleContinue}>
            Continue
          </button>
          <OnboardingProgress currentStep={4} />
          <span className="text-xs text-gray-600 block text-center mt-2">
            Step 4 of 9
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
