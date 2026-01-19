import type { Timestamp } from "firebase-admin/firestore";

export interface AIPolicy {
  planKey: string;
  period: "monthly";
  capTokens: number;
  capRuns?: number;
  softLimitTokens: number;
  overageEnabled: boolean;
  featureAccess: Record<string, boolean>;
  updatedAt: Timestamp;
}

import { adminDb } from "@/lib/firebaseAdmin";
import { resolvePlan } from "@/lib/plans";

/**
 * Updates the AI policy for a workspace based on the planKey.
 * Sets capTokens and featureAccess according to the plan.
 */
export async function updateAIPolicyForPlan(workspaceId: string, planKey: string) {
  const db = adminDb();
  const plan = resolvePlan(planKey);
  const aiPolicyRef = db.collection("workspaces").doc(workspaceId).collection("ai_policy").doc("current");
  await aiPolicyRef.set({
    planKey,
    period: "monthly",
    capTokens: plan.monthlyAiCredits,
    capRuns: plan.workflow?.maxRunsPerMonth ?? null,
    softLimitTokens: Math.floor(plan.monthlyAiCredits * 0.8),
    overageEnabled: true, // or set based on plan if needed
    featureAccess: plan.features,
    updatedAt: new Date(),
  }, { merge: true });
}
