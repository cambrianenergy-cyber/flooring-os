import { resolvePlan, PlanKey } from "@/lib/plans";
// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";
const adminDb = () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }) }) });

/**
 * Returns the monthly AI action quota for a workspace based on its plan.
 */
export async function getWorkspaceAiQuota(workspaceId: string): Promise<{ quota: number; planKey: PlanKey }> {
  const db = adminDb();
  const wsDoc = await db.collection("workspaces").doc(workspaceId).get();
  if (!wsDoc.exists) throw new Error("Workspace not found");
  const planKey = wsDoc.data()?.planKey as PlanKey || "start";
  const plan = resolvePlan(planKey);
  return { quota: plan.monthlyAiCredits, planKey };
}

/**
 * Returns the current AI action usage for a workspace for the current month.
 */
export async function getWorkspaceAiUsage(workspaceId: string): Promise<{ used: number; quota: number; planKey: PlanKey }> {
  const db = adminDb();
  const now = new Date();
  const periodKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const counterRef = db.collection("usage_counters").doc(`${workspaceId}_${periodKey}`);
  const counterSnap = await counterRef.get();
  const used = counterSnap.exists ? (counterSnap.data()?.agentRuns ?? 0) : 0;
  const { quota, planKey } = await getWorkspaceAiQuota(workspaceId);
  return { used, quota, planKey };
}
