"use client";
import React, { useState } from "react";
import { useWorkflow } from "@/lib/workflow";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingProgress from "../OnboardingProgress";
import { useRouter } from "next/navigation";

export default function ReviewLaunchStep() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const router = useRouter();
  const { setStep, completeStep } = useWorkflow();

  // Placeholder for payment integration
  const handlePayment = async () => {
    setLoading(true);
    setError("");
    try {
      // TODO: Integrate with Stripe or payment provider
      await new Promise(res => setTimeout(res, 1500)); // Simulate payment
      setPaymentComplete(true);
      setStep("KPI");
      completeStep("KPI");
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = () => {
    router.push("/dashboard");
  };

  return (
    <OnboardingLayout step={9}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">Review & Launch</h1>
          <ul className="list-disc pl-6 mb-4 text-sm">
            <li>Review your onboarding details</li>
            <li>Test run your workflow</li>
            <li>Invite your team</li>
            <li>Complete payment to launch</li>
          </ul>
          {!paymentComplete ? (
            <button
              className="btn btn-primary w-full mb-2"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? "Processing Payment..." : "Complete Payment & Launch"}
            </button>
          ) : (
            <button
              className="btn btn-success w-full mb-2"
              onClick={handleLaunch}
            >
              Go to Dashboard
            </button>
          )}
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <OnboardingProgress currentStep={10} totalSteps={10} />
          <span className="text-xs text-muted block text-center mt-2">Step 10 of 10</span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
