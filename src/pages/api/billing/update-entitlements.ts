import { NextApiRequest, NextApiResponse } from "next";
import { getFirestore } from "firebase-admin/firestore";
import { FEATURE_MATRIX, PlanTier } from "@/lib/plans/featureMatrixV2";

// POST /api/billing/update-entitlements
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { workspaceId, planTier } = req.body;
  if (!workspaceId || !planTier) {
    return res.status(400).json({ error: "Missing workspaceId or planTier" });
  }
  try {
    const db = getFirestore();
    const entitlements = FEATURE_MATRIX[planTier as PlanTier] || FEATURE_MATRIX["foundation" as PlanTier];
    await db
      .collection("workspaces")
      .doc(workspaceId)
      .collection("entitlements")
      .doc("main")
      .set(entitlements, { merge: true });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
