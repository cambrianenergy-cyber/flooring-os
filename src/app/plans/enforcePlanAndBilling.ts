import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Middleware to enforce user caps and feature access based on plan and billing status.
 * Usage: Call in API routes or server components before protected actions.
 */
export async function enforcePlanAndBilling(
  workspaceId: string,
  requiredFeature: string | null = null
): Promise<{ allowed: boolean; reason?: string }> {
  // Fetch workspace plan and billing status from Firestore
  const wsRef = adminDb().collection("workspaces").doc(workspaceId);
  const wsSnap = await wsRef.get();
  if (!wsSnap.exists) {
    return { allowed: false, reason: "Workspace not found" };
  }
  const wsData = wsSnap.data();
  if (!wsData) {
    return { allowed: false, reason: "Workspace data not found" };
  }
  // Example fields: wsData.planId, wsData.billingStatus, wsData.members (array)
  // 1. Enforce user cap
  const planId = wsData.planId as keyof typeof PLAN_FEATURES;
  const planFeatures = PLAN_FEATURES[planId];
  if (planFeatures && wsData.members && wsData.members.length > planFeatures.users) {
    return { allowed: false, reason: "User cap exceeded for plan" };
  }
  // 2. Enforce billing status
  if (wsData.billingStatus !== "active") {
    return { allowed: false, reason: "Billing inactive" };
  }
  // 3. Enforce feature access
  if (requiredFeature && planFeatures) {
    // Only check if requiredFeature is a key of planFeatures
    if (!(requiredFeature in planFeatures) || !planFeatures[requiredFeature as keyof typeof planFeatures]) {
      return { allowed: false, reason: `Feature '${requiredFeature}' not allowed for plan` };
    }
  }
  return { allowed: true };
}

// Example usage in an API route:
// const { allowed, reason } = await enforcePlanAndBilling(workspaceId, "ai");
// if (!allowed) return NextResponse.json({ error: reason }, { status: 403 });

import { PLAN_FEATURES } from "./planFeatures";
