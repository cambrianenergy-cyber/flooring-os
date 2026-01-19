"use client";
import React, { useState, useEffect } from "react";
import { useCallback } from "react";
// Stripe Connect Onboarding Panel
function StripeConnectPanel({ workspaceId }: { workspaceId: string }) {
  const [status, setStatus] = useState<string>("loading");
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  // Removed unused: detailsSubmitted, accountId, connectUrl
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string>("");
  const [depositPolicy, setDepositPolicy] = useState<string>("");
  const [testChargeStatus, setTestChargeStatus] = useState<string>("");

  // Fetch Stripe Connect status
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/stripe-connect`);
      const data = await res.json();
      setStatus(data.status);
      setChargesEnabled(!!data.charges_enabled);
      setPayoutsEnabled(!!data.payouts_enabled);
    } catch {
      setError("Failed to fetch Stripe status");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Create Stripe Connect onboarding link
  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/stripe-connect`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to get Stripe Connect link");
      }
    } catch {
      setError("Failed to connect Stripe");
    } finally {
      setLoading(false);
    }
  };

  // Test charge (optional)
  const handleTestCharge = async () => {
    setTestChargeStatus("Charging...");
    // TODO: Implement backend endpoint for test charge
    setTimeout(() => setTestChargeStatus("Success! (simulated)"), 1200);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-blue-800">Stripe Connect (Company Payments)</div>
        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 ml-2">{status === "active" ? "Connected" : status === "pending" ? "Pending" : "Not Connected"}</span>
      </div>
      <div className="mb-2 text-sm text-blue-900">
        {chargesEnabled && payoutsEnabled ? (
          <span>Charges and payouts are enabled for your company.</span>
        ) : (
          <span>Connect your Stripe account to enable company payments and payouts.</span>
        )}
      </div>
      <div className="flex gap-4 items-center mb-2">
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          onClick={handleConnect}
          disabled={loading || status === "active"}
        >
          {status === "active" ? "Stripe Connected" : loading ? "Connecting..." : "Connect Stripe"}
        </button>
        {error && <span className="text-red-600 text-xs ml-2">{error}</span>}
      </div>
      <div className="mb-2">
        <label className="block text-xs font-semibold mb-1">Who receives payouts?</label>
        <select
          className="border rounded px-2 py-1 bg-white text-blue-900 border-blue-200"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
        >
          <option value="">Select...</option>
          <option value="company">Company</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-xs font-semibold mb-1">Deposit Policy</label>
        <div className="flex gap-2">
          {["No deposit", "10% upfront", "50% upfront", "Full upfront"].map(opt => (
            <button
              key={opt}
              type="button"
              className={`px-2 py-1 rounded border text-xs ${depositPolicy === opt ? 'bg-blue-200 border-blue-500 text-blue-900' : 'bg-white border-blue-200 text-blue-700'}`}
              onClick={() => setDepositPolicy(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <button
          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700 transition"
          onClick={handleTestCharge}
          type="button"
        >Test charge $1</button>
        {testChargeStatus && <span className="ml-2 text-green-700 text-xs">{testChargeStatus}</span>}
      </div>
    </div>
  );
}
// Helper to check onboarding status from Firestore (client-side)
async function fetchOnboardingStatus() {
  try {
    const { getAuth } = await import("firebase/auth");
    const { getFirestore, doc, getDoc } = await import("firebase/firestore");
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;
    if (!user) return false;
    const wsRef = doc(db, `workspaces/${user.uid}`);
    const snap = await getDoc(wsRef);
    return snap.exists() && snap.data().onboardingComplete === true;
  } catch {
    return false;
  }
}

import Image from "next/image";






export default function HomePage() {
  // Onboarding state
  const [step, setStep] = useState(1);
  const totalSteps = 9;
  const [accountType, setAccountType] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [volume, setVolume] = useState("");
  const [setupPath, setSetupPath] = useState("recommended");
  const [skipped, setSkipped] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  // Get workspaceId from Firebase user
  useEffect(() => {
    (async () => {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) setWorkspaceId(user.uid);
    })();
  }, []);
  // onboardingComplete state is not used in the UI, so remove it for now to fix the error

  // Check onboarding status on mount
  useEffect(() => {
    fetchOnboardingStatus().then((complete) => {
      // Set cookie for backend enforcement
      if (complete) {
        document.cookie = "onboardingComplete=true; path=/; max-age=31536000";
      } else {
        document.cookie = "onboardingComplete=false; path=/; max-age=31536000";
      }
    });
  }, []);

  // Options
  const accountTypes = ["Owner", "Admin", "Office Manager"];
  const companyTypes = ["Residential", "Commercial", "Both"];
  const goalOptions = [
    "Win more bids",
    "Faster estimates",
    "Job tracking",
    "Payments",
    "AI help"
  ];
  const volumeOptions = [
    "0–10 jobs",
    "10–25 jobs",
    "25–50 jobs",
    "50+ jobs"
  ];


  // Handlers
  const handleGoalToggle = (goal: string) => {
    setGoals((prev) => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  // Save onboarding data to API and alert
  type OnboardingData = {
    step?: string;
    persona?: string;
    companyType?: string;
    goals?: string[];
    monthlyVolume?: string;
    setupMode?: string;
    skipped?: boolean;
  };
  const saveOnboarding = async (data: OnboardingData) => {
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");
      const workspaceId = user.uid;
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, data }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed");
      alert("Onboarding saved!");
    } catch (err) {
      const error = err instanceof Error ? err : { message: String(err) };
      alert("Onboarding save failed: " + (error.message || err));
    }
  };

  const handleStart = async () => {
    // Save onboarding data and advance step
    await saveOnboarding({
      step: "welcome",
      persona: accountType,
      companyType,
      goals,
      monthlyVolume: volume,
      setupMode: setupPath,
    });
    setStep(2);
  };


  const handleSkip = async () => {
    await saveOnboarding({ skipped: true });
    setSkipped(true);
  };

  // Premium Welcome UI
  return (
    <div className="max-w-xl mx-auto py-12">
      {/* Onboarding status banner (always visible for demo/testing) */}
      <div className="bg-yellow-200 border-l-4 border-yellow-600 text-yellow-900 p-4 rounded mb-6 text-center font-bold text-lg shadow">
        <span className="block mb-1">🚧 Onboarding Incomplete</span>
        <span className="block text-sm font-normal">You must finish onboarding to unlock all features and access your company dashboard.</span>
        <a href="/onboarding/1" className="inline-block mt-2 underline text-yellow-800 font-semibold">Continue onboarding &rarr;</a>
      </div>
      {/* Logo/Hero */}
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/logo192.png"
          alt="Square Flooring Logo"
          width={80}
          height={80}
          className="rounded-full border border-blue-200 object-cover mb-4"
          priority
        />
        <h1 className="text-3xl font-bold text-blue-800 mb-2 text-center">Welcome to Square Flooring OS</h1>
        <p className="text-gray-600 text-center text-lg">We’re going to set up your company OS</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-6">
        <span className="text-blue-700 font-semibold">Step {step} of {totalSteps}</span>
        <span className="mx-2">•</span>
        <span className="text-gray-500 text-sm">~6 minutes to finish setup</span>
      </div>

      {/* Stripe Connect Panel (Company Payments) */}
      {workspaceId && <StripeConnectPanel workspaceId={workspaceId} />}

      {/* Onboarding Form: All Premium Features */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Let&apos;s set up your company OS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Type */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Account Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={accountType}
              onChange={e => setAccountType(e.target.value)}
            >
              <option value="">Select...</option>
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {/* Company Type */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Company Type</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={companyType}
              onChange={e => setCompanyType(e.target.value)}
            >
              <option value="">Select...</option>
              {companyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {/* Primary Goals */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-1">Primary Goals</label>
            <div className="flex flex-wrap gap-2">
              {goalOptions.map(goal => (
                <button
                  key={goal}
                  type="button"
                  className={`px-3 py-1 rounded border text-sm ${goals.includes(goal) ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
                  onClick={() => handleGoalToggle(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
          {/* Expected Monthly Volume */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Expected Monthly Volume</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={volume}
              onChange={e => setVolume(e.target.value)}
            >
              <option value="">Select...</option>
              {volumeOptions.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          {/* Guided Setup Path */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Setup Path</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="setupPath"
                  value="recommended"
                  checked={setupPath === "recommended"}
                  onChange={() => setSetupPath("recommended")}
                />
                <span>Recommended</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="setupPath"
                  value="advanced"
                  checked={setupPath === "advanced"}
                  onChange={() => setSetupPath("advanced")}
                />
                <span>Advanced</span>
              </label>
            </div>
          </div>
        </div>
        {/* Progress, Time Estimate, CTA, Skip, Micro Trust */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
          <div className="text-blue-700 font-semibold">Step {step} of {totalSteps}</div>
          <div className="text-gray-500 text-sm">~6 minutes to finish setup</div>
          <div className="flex gap-4">
            <button
              className="bg-blue-700 text-white px-6 py-2 rounded font-semibold hover:bg-blue-800 transition"
              onClick={handleStart}
              disabled={!accountType || !companyType || goals.length === 0 || !volume}
            >
              Start Setup
            </button>
            <button
              className="text-gray-500 underline text-sm"
              onClick={handleSkip}
              type="button"
            >
              Skip (not recommended)
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-3 text-center">You can change everything later.</div>
      </div>

      {/* Optionally, show a skipped message */}
      {skipped && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-yellow-900 font-semibold text-center">
          You skipped onboarding. You can finish setup anytime from your dashboard.
        </div>
      )}
    </div>
  );
}