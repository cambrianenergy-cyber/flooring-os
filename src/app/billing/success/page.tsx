"use client";
import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="max-w-xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-4 text-green-700">
        Upgrade Successful!
      </h1>
      <p className="mb-4 text-lg">
        Thank you for upgrading your plan. Your new features are now unlocked
        and your subscription is active.
      </p>
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-700 underline mr-4">
          Go to Dashboard
        </Link>
        <Link href="/billing" className="text-blue-700 underline">
          View Billing Summary
        </Link>
      </div>
      <div className="text-sm text-muted">
        If you have any questions or need help, please contact support.
      </div>
    </main>
  );
}
