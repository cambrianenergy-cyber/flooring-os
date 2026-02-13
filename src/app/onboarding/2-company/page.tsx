"use client";

/**
 * Firebase Admin Environment Variables (required for server-side SDK)
 *
 * FIREBASE_PROJECT_ID
 * FIREBASE_CLIENT_EMAIL
 * FIREBASE_PRIVATE_KEY (escape newlines or store raw with proper env handling)
 */
/**
 * Firestore Schemas (Collections + Fields)
 *
 * Workspaces
 *   workspaces/{workspaceId}
 *   workspaces/{workspaceId}/members/{uid}
 *     - role: "founder"|"owner"|"admin"|"member"|"viewer"
 *
 * Estimates
 *   workspaces/{workspaceId}/estimates/{estimateId}
 *     - estimateNumber: string
 *     - customerName: string
 *     - propertyAddress: string
 *     - status: "draft"|"sent"|"accepted"|"rejected"|"needs_approval"
 *     - total: number
 *     - marginPct: number
 *     - discountPct?: number
 *     - approval?: { approvedBy: string, approvedAt: timestamp, reason: string }
 *     - createdAt: timestamp
 *     - updatedAt: timestamp
 *
 * Jobs
 *   workspaces/{workspaceId}/jobs/{jobId}
 *     - title: string
 *     - customerName: string
 *     - propertyAddress: string
 *     - status: "scheduled"|"in_progress"|"blocked"|"completed"
 *     - blockedReason?: string
 *     - updatedAt: timestamp
 *
 * Invoices
 *   workspaces/{workspaceId}/invoices/{invoiceId}
 *     - invoiceNumber: string
 *     - customerName: string
 *     - dueDate: timestamp
 *     - status: "draft"|"sent"|"partial"|"paid"|"overdue"
 *     - total: number
 *     - balanceDue?: number
 *     - stripePaymentLink?: string
 *     - updatedAt: timestamp
 *
 * Policies (Founder-only)
 *   workspaces/{workspaceId}/policies/global
 *     - marginFloorPct: number
 *     - maxDiscountPct: number
 *     - lockdownMode: boolean
 *     - updatedAt: timestamp
 *     - updatedBy: string
 *
 * Audit Logs (Founder-only)
 *   workspaces/{workspaceId}/audit_logs/{logId}
 *     - actorUid: string
 *     - action: string
 *     - entityType: string
 *     - entityId: string
 *     - reason: string
 *     - before: any
 *     - after: any
 *     - createdAt: timestamp
 */
/**
 * Suggested Firestore Indexes (starter)
 *
 * estimates: status + createdAt desc
 * jobs: status + updatedAt desc
 * invoices: dueDate asc (single-field), plus status + dueDate asc
 * audit_logs: entityType + createdAt desc, actorUid + createdAt desc
 */

import { useAuth } from "@/hooks/useAuth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import OnboardingLayout from "../OnboardingLayout";
// import { useWorkspace } from "../../../lib/workspace"; // Uncomment if you have workspace context

export default function CompanyPage() {
  // const { workspace } = useWorkspace(); // Uncomment if you have workspace context
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  // Use workspaceId from user context or user object
  const workspaceId = user?.uid;
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedCompany, setSavedCompany] = useState<{
    companyName?: string;
    industry?: string;
  } | null>(null);
  const router = useRouter();

  // Fetch saved company info on mount, only after auth is ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !workspaceId) return;
      try {
        const onboardingRef = doc(
          db,
          "workspaces",
          workspaceId,
          "onboarding",
          "state",
        );
        const snap = await getDoc(onboardingRef);
        if (snap.exists() && snap.data().company) {
          setSavedCompany(snap.data().company);
        }
      } catch {}
    });
    return () => unsubscribe();
  }, [workspaceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!user || !workspaceId) {
      setError("You must be signed in to save.");
      setLoading(false);
      return;
    }
    try {
      await setDoc(
        doc(db, "workspaces", workspaceId, "onboarding", "state"),
        {
          company: { companyName, industry },
          step: "company",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      setSavedCompany({ companyName, industry });
      router.push("/onboarding/team");
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingLayout step={2}>
      <div className="max-w-xl mx-auto bg-background text-slate-900/90 rounded-2xl shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold mb-4 text-slate-900">Company Info</h1>
        {savedCompany && (
          <div className="mb-4 p-4 border rounded-xl bg-blue-50">
            <div className="font-semibold text-blue-900">
              Saved Company Info:
            </div>
            <div>
              Company Name:{" "}
              <span className="font-medium">{savedCompany.companyName}</span>
            </div>
            <div>
              Industry:{" "}
              <span className="font-medium">{savedCompany.industry}</span>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="company-name"
              className="block mb-1 text-xs font-semibold text-slate-500"
            >
              Company Name
            </label>
            <input
              id="company-name"
              name="company-name"
              className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-400"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="industry"
              className="block mb-1 text-xs font-semibold text-slate-500"
            >
              Industry
            </label>
            <input
              id="industry"
              name="industry"
              className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-400"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-4 mt-8 justify-between">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-6 py-2 text-base font-medium text-gray-700 bg-background text-foreground hover:bg-gray-50 transition"
              onClick={() => router.push("/onboarding/welcome")}
            >
              Back
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-8 py-3 text-base font-semibold text-background shadow-md hover:bg-blue-800 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save & Continue"}
            </button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}
