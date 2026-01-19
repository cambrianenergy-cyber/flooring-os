import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import type { AiUsageAction } from "@/lib/aiUsage";

/**
 * Record an AI usage event in Firestore
 */
import { collection, addDoc } from "firebase/firestore";

export async function recordAIUsage(
  workspaceId: string,
  action: AiUsageAction,
  tokens: number
): Promise<void> {
  await addDoc(collection(db, "ai_usage"), {
    workspaceId,
    action,
    tokensUsed: tokens,
    createdAt: Timestamp.now(),
  });
}
