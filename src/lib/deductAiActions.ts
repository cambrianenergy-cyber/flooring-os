import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Deducts AI actions from the workspace's usage counter for the current month.
 * Throws if the workspace is out of quota.
 */
export async function deductAiActions(workspaceId: string, actions: number) {
  const db = adminDb();
  const now = new Date();
  const periodKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const counterRef = db.collection("usage_counters").doc(`${workspaceId}_${periodKey}`);
  const counterSnap = await counterRef.get();
  let data = counterSnap.exists ? counterSnap.data() : null;
  if (!data) {
    // Initialize if missing
    data = {
      workspaceId,
      periodKey,
      seatsUsed: 0,
      agentsEnabled: 0,
      workflowRuns: 0,
      agentRuns: 0,
      documentsGenerated: 0,
      storageBytes: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  // Example quota: 1000 actions per month (replace with plan-based logic)
  const quota = 1000;
  if ((data.agentRuns ?? 0) + actions > quota) {
    throw new Error("AI action quota exceeded for this workspace. Please upgrade your plan.");
  }
  await counterRef.set({
    ...data,
    agentRuns: (data.agentRuns ?? 0) + actions,
    updatedAt: Date.now(),
  }, { merge: true });
}
