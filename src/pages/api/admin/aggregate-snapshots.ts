import {
  aggregateFounderGlobalSnapshot,
  aggregateWorkspaceSnapshotsForFounder,
} from "@/lib/aggregateFounderSnapshots";
import { getFirestore } from "firebase-admin/firestore";
import { NextApiRequest, NextApiResponse } from "next";

// Optionally, add admin authentication/authorization here
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  // Optionally, check for admin token/role here
  try {
    const db = getFirestore();
    const workspacesSnap = await db.collection("workspaces").get();
    const founderUserIds = Array.from(
      new Set(workspacesSnap.docs.map((doc) => doc.data().founderUserId)),
    );
    for (const founderUserId of founderUserIds) {
      await aggregateFounderGlobalSnapshot(founderUserId);
      await aggregateWorkspaceSnapshotsForFounder(founderUserId);
    }
    res.status(200).json({ status: "Aggregation complete" });
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    res.status(500).json({ error: message });
  }
}
