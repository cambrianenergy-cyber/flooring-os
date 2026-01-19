import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";


/**
 * Reset AI credits for a workspace at the start of a new billing cycle.
 * This function should be called when billingCycleReset is true.
 */

export async function resetAiCredits(workspaceId: string): Promise<void> {
  // Example: Update the workspace document to reset AI credits
  const wsRef = doc(db, "workspaces", workspaceId);
  await updateDoc(wsRef, {
    aiCreditsUsed: 0,
    aiCreditsResetAt: new Date(),
  });
}
