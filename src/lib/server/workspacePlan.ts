// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";
const adminDb = () => ({ collection: () => ({ doc: () => ({ get: async () => ({ data: () => ({}), exists: false }) }) }) });
import { PLANS, type PlanKey } from "@/lib/plans";

export type WorkspacePlan = {
  workspaceId: string;
  planKey: PlanKey;
};

export async function getWorkspacePlan(workspaceId: string): Promise<WorkspacePlan> {
  const snap = await adminDb().collection("workspaces").doc(workspaceId).get();
  const data = snap.data() || {};
  const planKey = (data.planKey as PlanKey) ?? "starter";
  return { workspaceId, planKey };
}

export async function getWorkspacePlanFeatures(workspaceId: string) {
  const { planKey } = await getWorkspacePlan(workspaceId);
  return PLANS[planKey].features;
}
