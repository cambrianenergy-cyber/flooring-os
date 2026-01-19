"use client";
import React, { useState } from "react";
import { useWorkflow } from "@/lib/workflow";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";
import { useRouter } from "next/navigation";

export default function StripeConnectStep() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Placeholder for Stripe Connect logic
  const handleConnect = async () => {
    setLoading(true);
    setError("");
    try {
      // TODO: Integrate with Stripe Connect
      setConnected(true);
      const { setStep, completeStep } = useWorkflow();
      setStep("Estimate");
      completeStep("Estimate");
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    try {
      // TODO: Replace with workflow state logic
      router.push("/onboarding/4-pricing-settings");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={3}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">Connect Stripe</h1>
          <p className="mb-4 text-center">Connect your Stripe account to enable payments and payouts.</p>
          <div className="flex flex-col items-center mb-4">
            <button
              className="btn btn-secondary mb-2"
              onClick={handleConnect}
              disabled={connected || loading}
            >
              {connected ? "Connected" : loading ? "Connecting..." : "Connect Stripe"}
            </button>
            {connected && <span className="text-green-600 text-sm">Stripe account connected!</span>}
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button
            className="btn btn-primary w-full"
            onClick={handleContinue}
            disabled={!connected || loading}
          >
            Continue
          </button>
          <OnboardingProgress currentStep={4} totalSteps={9} />
          <span className="text-xs text-muted block text-center mt-2">Step 4 of 9</span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
