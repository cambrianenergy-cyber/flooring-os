"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ServiceAreaPage() {
  const router = useRouter();

  // Placeholder for service area setup UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-green-900 mb-4">Set Up Your Service Area</h1>
        <p className="text-green-700 mb-6">Tell us where your business operates. This helps us match you with the right customers and jobs.</p>
        {/* TODO: Add service area form fields here */}
        <button
          className="mt-8 w-full rounded bg-primary px-4 py-2 text-background font-semibold text-center hover:bg-primary/80 transition"
          onClick={() => router.push("/dashboard")}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
