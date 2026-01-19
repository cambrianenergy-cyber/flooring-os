import { FEATURE_MATRIX, type PlanTier } from "@/lib/plans/featureMatrixV2";
import { adminDb } from "@/lib/firebaseAdmin";

type WorkspacePlanDoc = {
  tier?: PlanTier;
  status?: "active" | "past_due" | "canceled";
  ownerId?: string;
};

export async function getWorkspaceEntitlements(workspaceId: string) {
  const snap = await adminDb().collection("workspaces").doc(workspaceId).get();
  if (!snap.exists) throw new Error("Workspace not found");

  const data = snap.data() as WorkspacePlanDoc;

  const tier: PlanTier = (data?.tier || (data as any)?.plan?.tier || (data as any)?.planTier || "foundation") as PlanTier;

  const isFounder = (data as any)?.ownerId === process.env.FOUNDER_UID;
  const effectiveTier: PlanTier = isFounder ? "founder" : tier;

  return {
    tier: effectiveTier,
    entitlements: FEATURE_MATRIX[effectiveTier],
  };
}
