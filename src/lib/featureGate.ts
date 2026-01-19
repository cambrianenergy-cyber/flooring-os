import { adminDb } from "./firebaseAdmin";
import { resolvePlan } from "./plans";

export async function getWorkspacePlan(workspaceId: string) {
  const db = adminDb();
  const ws = await db.collection("workspaces").doc(workspaceId).get();
  if (!ws.exists) throw new Error("WORKSPACE_NOT_FOUND");

  const planKey = ws.data()!.plan?.key || "foundation";
  const status = ws.data()!.plan?.status || "canceled";

  return { plan: resolvePlan(planKey), status };
}

export function requireActiveBilling(status: string) {
  // You can decide if trialing is OK. Usually yes.
  const allowed = new Set(["active", "trialing"]);
  if (!allowed.has(status)) throw new Error("BILLING_INACTIVE");
}

export async function requireFeature(workspaceId: string, feature: keyof ReturnType<typeof resolvePlan>["features"]) {
  const { plan, status } = await getWorkspacePlan(workspaceId);
  requireActiveBilling(status);
  if (!plan.features[feature]) throw new Error("FEATURE_NOT_AVAILABLE");
  return { plan, status };
}
