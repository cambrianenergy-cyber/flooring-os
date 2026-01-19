import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase-admin/auth';
import { doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import type { AIEvent } from '@/lib/types/aiEvent';
import type { AIRollupDaily } from '@/lib/types/aiRollupDaily';
import type { AIRollupMonthly } from '@/lib/types/aiRollupMonthly';
import type { AIPolicy } from '@/lib/types/aiPolicy';
import { v4 as uuidv4 } from 'uuid';

// --- Helper: Validate membership (server-side) ---
async function validateMembership(workspaceId: string, uid: string) {
  const memberDoc = await getDoc(doc(db, `workspace_members/${workspaceId}_${uid}`));
  if (!memberDoc.exists() || memberDoc.data().status !== 'active') {
    throw new Error('Not a workspace member');
  }
}

// --- Helper: Load policy ---
async function getPolicy(workspaceId: string): Promise<AIPolicy> {
  const policyDoc = await getDoc(doc(db, `workspaces/${workspaceId}/ai_policy/current`));
  if (!policyDoc.exists()) throw new Error('AI policy not found');
  return policyDoc.data() as AIPolicy;
}

// --- Helper: Get monthly rollup ---
async function getMonthlyRollup(workspaceId: string, monthKey: string): Promise<AIRollupMonthly | null> {
  const rollupDoc = await getDoc(doc(db, `workspaces/${workspaceId}/ai_rollups_monthly/${monthKey}`));
  return rollupDoc.exists() ? (rollupDoc.data() as AIRollupMonthly) : null;
}

// --- Helper: Run AI tool (mock) ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAITool(featureKey: string, input: any): Promise<{ output: any, tokensIn: number, tokensOut: number, costUsd: number }> {
  // Replace with real AI logic
  void input;
  return {
    output: { result: `AI output for ${featureKey}` },
    tokensIn: 100,
    tokensOut: 120,
    costUsd: 0.02,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: any) {
  try {
    const { workspaceId, featureKey, agentKey, input } = await request.json();
    // 1. Auth: get user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing auth' }, { status: 401 });
    const idToken = authHeader.replace('Bearer ', '');
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // 2. Validate membership
    await validateMembership(workspaceId, uid);

    // 3. Load policy
    const policy = await getPolicy(workspaceId);
    if (!policy.featureAccess[featureKey]) {
      return NextResponse.json({ error: 'Feature not enabled for plan' }, { status: 403 });
    }

    // 4. Check cap (monthly)
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthly = await getMonthlyRollup(workspaceId, monthKey);
    if (monthly && monthly.tokensTotal >= policy.capTokens) {
      return NextResponse.json({ error: 'Monthly token cap exceeded' }, { status: 403 });
    }

    // 5. Run AI tool
    const aiResult = await runAITool(featureKey, input);

    // 6. Write ai_events and update rollups atomically
    const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const eventId = uuidv4();
    const event: AIEvent = {
      uid,
      agentKey,
      featureKey,
      tokensIn: aiResult.tokensIn,
      tokensOut: aiResult.tokensOut,
      costUsd: aiResult.costUsd,
      createdAt: now,
      dayKey,
      monthKey,
    };
    await runTransaction(db, async (trx) => {
      // Write event
      trx.set(doc(db, `workspaces/${workspaceId}/ai_events/${eventId}`), {
        ...event,
        createdAt: Timestamp.fromDate(now),
      });
      // Update daily rollup
      const dailyRef = doc(db, `workspaces/${workspaceId}/ai_rollups_daily/${dayKey}`);
      const dailySnap = await trx.get(dailyRef);
      const daily: AIRollupDaily = dailySnap.exists() ? dailySnap.data() as AIRollupDaily : {
        dayKey,
        runs: 0,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        byFeature: {},
        byUser: {},
        updatedAt: Timestamp.fromDate(now),
      };
      daily.runs++;
      daily.tokensIn += aiResult.tokensIn;
      daily.tokensOut += aiResult.tokensOut;
      daily.costUsd += aiResult.costUsd;
      // Fast+safe: increment byFeature and byUser for both tokensIn and tokensOut
      daily.byFeature[featureKey] = daily.byFeature[featureKey] || { runs: 0, tokens: 0, costUsd: 0 };
      daily.byFeature[featureKey].runs++;
      daily.byFeature[featureKey].tokens += aiResult.tokensIn + aiResult.tokensOut;
      daily.byFeature[featureKey].costUsd += aiResult.costUsd;
      daily.byUser[uid] = daily.byUser[uid] || { runs: 0, tokens: 0, costUsd: 0 };
      daily.byUser[uid].runs++;
      daily.byUser[uid].tokens += aiResult.tokensIn + aiResult.tokensOut;
      daily.byUser[uid].costUsd += aiResult.costUsd;
      daily.updatedAt = Timestamp.fromDate(now);
      trx.set(dailyRef, daily);
      // Update monthly rollup
      const monthlyRef = doc(db, `workspaces/${workspaceId}/ai_rollups_monthly/${monthKey}`);
      const monthlySnap = await trx.get(monthlyRef);
      const monthly: AIRollupMonthly = monthlySnap.exists() ? monthlySnap.data() as AIRollupMonthly : {
        monthKey,
        runs: 0,
        tokensTotal: 0,
        costUsd: 0,
        capTokens: policy.capTokens,
        capRuns: policy.capRuns,
        byFeature: {},
        byUser: {},
        updatedAt: Timestamp.fromDate(now),
      };
      monthly.runs++;
      monthly.tokensTotal += aiResult.tokensIn + aiResult.tokensOut;
      monthly.costUsd += aiResult.costUsd;
      // Fast+safe: increment byFeature and byUser for both tokensIn and tokensOut
      monthly.byFeature[featureKey] = monthly.byFeature[featureKey] || { runs: 0, tokens: 0, costUsd: 0 };
      monthly.byFeature[featureKey].runs++;
      monthly.byFeature[featureKey].tokens += aiResult.tokensIn + aiResult.tokensOut;
      monthly.byFeature[featureKey].costUsd += aiResult.costUsd;
      monthly.byUser[uid] = monthly.byUser[uid] || { runs: 0, tokens: 0, costUsd: 0 };
      monthly.byUser[uid].runs++;
      monthly.byUser[uid].tokens += aiResult.tokensIn + aiResult.tokensOut;
      monthly.byUser[uid].costUsd += aiResult.costUsd;
      monthly.updatedAt = Timestamp.fromDate(now);
      trx.set(monthlyRef, monthly);
    });

    // 7. Return response
    return NextResponse.json({ output: aiResult.output });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI run failed' }, { status: 400 });
  }
}
