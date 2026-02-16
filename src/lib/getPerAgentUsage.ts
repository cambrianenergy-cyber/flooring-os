// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";
const adminDb = () => ({
  collection: () => ({
    where: () => ({ get: async () => ({ docs: [] }) })
  })
});

/**
 * Returns per-agent usage stats for the current month for a workspace.
 * Returns: Array of { agentId, runs }
 */
export async function getPerAgentUsage(workspaceId: string): Promise<Array<{ agentId: string; runs: number }>> {
  const db = adminDb();
  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const snap = await db
    .collection("agent_runs")
    .where("workspaceId", "==", workspaceId)
    .where("createdAt", ">=", monthStart)
    .get();
  const counts: Record<string, number> = {};
  for (const doc of snap.docs) {
    const { agentId } = doc.data();
    if (!agentId) continue;
    counts[agentId] = (counts[agentId] || 0) + 1;
  }
  return Object.entries(counts).map(([agentId, runs]) => ({ agentId, runs }));
}
