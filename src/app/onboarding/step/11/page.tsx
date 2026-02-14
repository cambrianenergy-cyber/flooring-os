import React from "react";
"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingStep11Page() {
  const router = useRouter();
  const { user } = useAuth();
  
  const handleFinish = () => {
    if (user) {
      router.push(`/app/${user.uid}/dashboard`);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">You're All Set! 🎉</h1>
        <p className="text-gray-600 mt-2">Your workspace is ready to use</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Setup Complete</h3>
          <p className="text-sm text-green-800 mb-4">
            You've successfully configured your SquareOS workspace. You can now:
          </p>
          <ul className="text-sm text-green-800 space-y-1 list-disc pl-5">
            <li>Create and manage estimates</li>
            <li>Track jobs and projects</li>
            <li>Manage your team</li>
            <li>Send invoices</li>
            <li>And much more!</li>
          </ul>
        </div>
        
        <button
          onClick={handleFinish}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}
