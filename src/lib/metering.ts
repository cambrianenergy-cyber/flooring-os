// Server-only code removed for static export
// import { adminDb } from "./firebaseAdmin";
const adminDb = () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }) }) });
import { resolvePlan } from "./plans";

interface Usage {
  creditsUsed: number;
  tokensUsed: number;
  workflowRuns: number;
}

function yyyymmUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

// Convert tokens to credits (tune this)
// Example: 1 credit per 200 tokens
export function tokensToCredits(tokens: number) {
  return Math.max(1, Math.ceil(tokens / 200));
}

export async function getMonthlyUsage(workspaceId: string, now = new Date()) {
  const db = adminDb();
  const key = `${workspaceId}_${yyyymmUTC(now)}`;
  const ref = db.collection("ai_monthly").doc(key);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ref, data: { creditsUsed: 0, tokensUsed: 0, workflowRuns: 0 } };
  }
  return { ref, data: snap.data() as Record<string, unknown> };
}

export async function requireAiBudget(workspaceId: string) {
  const db = adminDb();
  const wsRef = db.collection("workspaces").doc(workspaceId);
  const ws = await wsRef.get();
  if (!ws.exists) throw new Error("WORKSPACE_NOT_FOUND");
  const planKey = ws.data()!.plan?.key || "foundation";
  const plan = resolvePlan(planKey);

  const { data } = await getMonthlyUsage(workspaceId);
  const usage = (data as unknown) as Usage;
  if (usage.creditsUsed >= plan.monthlyAiCredits) {
    // Flag overage in workspace doc
    await wsRef.set({
      aiOverage: true,
      aiOverageCredits: usage.creditsUsed - plan.monthlyAiCredits,
      aiOverageUpdatedAt: new Date(),
    }, { merge: true });
    throw new Error("AI_CREDITS_EXHAUSTED");
  }

  // Clear overage flag if under limit
  if (ws.data()?.aiOverage) {
    await wsRef.set({ aiOverage: false, aiOverageCredits: 0 }, { merge: true });
  }
  return { plan, usage };
}

export async function recordAiUsage(params: {
  workspaceId: string;
  uid: string | null;
  kind: "chat" | "estimate_suggest" | "pricing_calc" | "workflow_step";
  tokens: number;
  model: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  const db = adminDb();
  const credits = tokensToCredits(params.tokens);
  const monthKey = `${params.workspaceId}_${yyyymmUTC()}`;

  const monthlyRef = db.collection("ai_monthly").doc(monthKey);

  await db.runTransaction(async (tx) => {
    const wsSnap = await tx.get(db.collection("workspaces").doc(params.workspaceId));
    if (!wsSnap.exists) throw new Error("WORKSPACE_NOT_FOUND");
    const planKey = wsSnap.data()!.plan?.key || "foundation";
    const plan = resolvePlan(planKey);

    const monthlySnap = await tx.get(monthlyRef);
    const monthly: Usage = monthlySnap.exists
      ? (monthlySnap.data() as Usage)
      : { creditsUsed: 0, tokensUsed: 0, workflowRuns: 0 };

    const nextCredits = monthly.creditsUsed + credits;
    if (nextCredits > plan.monthlyAiCredits) {
      // If overage billing is enabled, send Stripe Meter Event for each overage action
      const { maybeSendAiOverageMeterEvent } = await import("./maybeSendAiOverageMeterEvent");
      await maybeSendAiOverageMeterEvent(params.workspaceId, credits);
      // Still enforce hard-stop if no metered price is attached (maybeSendAiOverageMeterEvent is a no-op)
      throw new Error("AI_CREDITS_EXHAUSTED");
    }

    tx.set(monthlyRef, {
      workspaceId: params.workspaceId,
      yyyymm: yyyymmUTC(),
      creditsUsed: nextCredits,
      tokensUsed: monthly.tokensUsed + params.tokens,
      workflowRuns: monthly.workflowRuns,
      updatedAt: new Date(),
    }, { merge: true });

    tx.create(db.collection("ai_usage").doc(), {
      workspaceId: params.workspaceId,
      uid: params.uid,
      kind: params.kind,
      tokens: params.tokens,
      credits,
      model: params.model,
      ref: { entityType: params.entityType || null, entityId: params.entityId || null },
      createdAt: new Date(),
    });
  });

  return { credits };
}

// Grant extra AI credits to a workspace (for overage purchase)
export async function grantAiOverageCredits(workspaceId: string, credits: number) {
  const db = adminDb();
  const now = new Date();
  const monthKey = `${workspaceId}_${yyyymmUTC(now)}`;
  const monthlyRef = db.collection("ai_monthly").doc(monthKey);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(monthlyRef);
    const monthly: Usage = snap.exists ? (snap.data() as Usage) : { creditsUsed: 0, tokensUsed: 0, workflowRuns: 0 };
    tx.set(monthlyRef, {
      ...monthly,
      creditsUsed: monthly.creditsUsed + credits,
      updatedAt: now,
    }, { merge: true });
  });
  // Clear overage flag
  await db.collection("workspaces").doc(workspaceId).set({ aiOverage: false, aiOverageCredits: 0 }, { merge: true });
}
