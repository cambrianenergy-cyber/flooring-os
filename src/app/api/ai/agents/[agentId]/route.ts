// Utility to cast input to the expected type for each agent
function asAgentInput<T>(input: unknown): T {
  return input as T;
}


import { NextRequest, NextResponse } from "next/server";
import { estimatorAgent } from "../estimator";
import { schedulingAgent } from "../scheduling";
import { leadScoringAgent } from "../leadScoring";
import { workflowAgent } from "../workflow";
import { proposalWritingAgent } from "../proposalWriting";
import { closeRateAnalystAgent } from "../closeRateAnalyst";
import { smartEstimatorAgent } from "../smartEstimator";
import { pricingOptimizerAgent } from "../pricingOptimizer";
import { marginGuardAgent } from "../marginGuard";
import { estimateComparatorAgent } from "../estimateComparator";
import { workflowAutomationAgent } from "../workflowAutomation";
import { complianceAgent } from "../compliance";
import { crewCoordinationAgent } from "../crewCoordination";
import { delayDetectionAgent } from "../delayDetection";
import { getAuth } from "firebase-admin/auth";
import { AGENTS, type AgentKey } from "@/lib/agents/registry";

const AGENT_MAP: Record<AgentKey, (input: unknown) => Promise<unknown>> = {
  estimator: (input) => Promise.resolve(estimatorAgent(asAgentInput<Parameters<typeof estimatorAgent>[0]>(input))),
  scheduler: (input) => Promise.resolve(schedulingAgent(asAgentInput<Parameters<typeof schedulingAgent>[0]>(input))),
  inbox: () => Promise.resolve({ message: "Unified Inbox agent not implemented yet." }),
  closer: () => Promise.resolve({ message: "Closer agent not implemented yet." }),
  ops: () => Promise.resolve({ message: "Ops agent not implemented yet." }),
  support: () => Promise.resolve({ message: "Support agent not implemented yet." }),
  leadScoring: (input) => Promise.resolve(leadScoringAgent(asAgentInput<Parameters<typeof leadScoringAgent>[0]>(input))),
  workflow: (input) => Promise.resolve(workflowAgent(asAgentInput<Parameters<typeof workflowAgent>[0]>(input))),
  proposalWriting: (input) => Promise.resolve(proposalWritingAgent(asAgentInput<Parameters<typeof proposalWritingAgent>[0]>(input))),
  closeRateAnalyst: (input) => Promise.resolve(closeRateAnalystAgent(asAgentInput<Parameters<typeof closeRateAnalystAgent>[0]>(input))),
  smartEstimator: (input) => Promise.resolve(smartEstimatorAgent(asAgentInput<Parameters<typeof smartEstimatorAgent>[0]>(input))),
  pricingOptimizer: (input) => Promise.resolve(pricingOptimizerAgent(asAgentInput<Parameters<typeof pricingOptimizerAgent>[0]>(input))),
  marginGuard: (input) => Promise.resolve(marginGuardAgent(asAgentInput<Parameters<typeof marginGuardAgent>[0]>(input))),
  estimateComparator: (input) => Promise.resolve(estimateComparatorAgent(asAgentInput<Parameters<typeof estimateComparatorAgent>[0]>(input))),
  workflowAutomation: (input) => Promise.resolve(workflowAutomationAgent(asAgentInput<Parameters<typeof workflowAutomationAgent>[0]>(input))),
  compliance: (input) => Promise.resolve(complianceAgent(asAgentInput<Parameters<typeof complianceAgent>[0]>(input))),
  crewCoordination: (input) => Promise.resolve(crewCoordinationAgent(asAgentInput<Parameters<typeof crewCoordinationAgent>[0]>(input))),
  delayDetection: (input) => Promise.resolve(delayDetectionAgent(asAgentInput<Parameters<typeof delayDetectionAgent>[0]>(input))),
  business_intelligence: () => Promise.resolve({ message: "Business Intelligence agent not implemented yet." }),
};


export async function POST(req: InstanceType<typeof NextRequest>, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  // Validate agent key
  function isAgentKey(x: unknown): x is AgentKey {
    return typeof x === "string" && x in AGENTS;
  }
  if (!isAgentKey(agentId) || !(agentId in AGENT_MAP)) {
    return NextResponse.json({
      error: "Unknown agent.",
      received: agentId ?? null,
      allowed: Object.keys(AGENT_MAP),
    }, { status: 400 });
  }
  const agentFn = AGENT_MAP[agentId as keyof typeof AGENT_MAP];
  let user = null;
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid auth token." }, { status: 401 });
    }
    const idToken = authHeader.replace("Bearer ", "");
    const decoded = await getAuth().verifyIdToken(idToken);
    user = decoded;
  } catch {
    return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
  }

  // Parse input from request body
  let input: Record<string, unknown> = {};
  try {
    input = await req.json();
  } catch {}

  // --- VALIDATION (basic, per agent) ---
  const requiredFields: Record<string, string[]> = {
    estimator: ["sqft", "product"],
    scheduler: ["jobId", "date"],
    leadScoring: [],
    workflow: [],
    proposalWriting: [],
    closeRateAnalyst: [],
    smartEstimator: [],
    pricingOptimizer: [],
    marginGuard: [],
    estimateComparator: [],
    workflowAutomation: [],
    compliance: [],
    crewCoordination: [],
    delayDetection: [],
    inbox: [],
    closer: [],
    ops: [],
    support: [],
    business_intelligence: [],
  };
  const missing = (requiredFields[agentId] ?? []).filter((f: string) => !(f in input));
  if (missing.length) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }

  try {
    // --- AI Event Idempotency for Stripe Metering ---
    const { nanoid } = await import('nanoid');
    const aiEventId = nanoid();
    const { createPendingAiEvent, isAiEventPosted, markAiEventPosted } = await import("src/lib/aiMeterEventStore");
    const { reportAiActionsToStripe } = await import("src/lib/reportAiActionsToStripe");
    const { checkEntitlement } = await import("src/lib/plans/entitlements");
    const { AGENT_UNITS } = await import("@/lib/aiUnits");
    const workspaceId = input.workspaceId || user?.workspaceId;
    if (!workspaceId) throw new Error("Missing workspaceId for metering");

    // Fetch workspace usage and plan info
    const { getWorkspaceAiUsage } = await import("@/lib/getWorkspaceAiUsage");
    const { used, quota: monthlyAiCredits, planKey } = await getWorkspaceAiUsage(workspaceId);

    // Fetch Stripe customer ID from workspace billing doc
    const { adminDb } = await import("@/lib/firebaseAdmin");
    const db = adminDb();
    const wsDoc = await db.collection("workspaces").doc(workspaceId).get();
    const stripeCustomerId = wsDoc.data()?.stripeCustomerId || null;

    // Use AGENT_UNITS mapping for actionUnits
    const actionUnits = AGENT_UNITS[agentId as AgentKey] ?? 1;

    // Map agentId to feature key (FeatureKey) for entitlement check
    const agentFeatureMap: Record<string, keyof import("@/lib/plans").PlanFeatures | undefined> = {
      pricingOptimizer: "pricingEngine",
      smartEstimator: "estimateIntelligence",
      docusign: "docusign",
      payments: "payments",
      multiLocation: "multiLocation",
      apiAccess: "apiAccess",
    };
    const featureKey = agentFeatureMap[agentId];
    const entitlementResult = checkEntitlement({ planKey, feature: featureKey });
    if (!entitlementResult.ok) {
      return NextResponse.json({ error: entitlementResult.reason, code: entitlementResult.code }, { status: 402 });
    }

    // 2. Store pending event for idempotency
    await createPendingAiEvent(workspaceId, aiEventId, { agentId, actionUnits, status: "pending" });
    if (await isAiEventPosted(workspaceId, aiEventId)) {
      return NextResponse.json({ error: "Duplicate AI event." }, { status: 409 });
    }

    // 3. Call agent logic
    const result = await agentFn(input);

    // 4. Meter usage and compute overage
    const newUsed = used + actionUnits;
    const overageUnits = Math.max(0, newUsed - monthlyAiCredits);

    // 5. Post Stripe Meter Event ONLY for overage
    const idempotencyKey = `${workspaceId}:${aiEventId}`;
    let stripeMeterEventId = null;
    if (stripeCustomerId && overageUnits > 0) {
      const meterEvent = await reportAiActionsToStripe({
        stripeCustomerId,
        workspaceId,
        actionUnits: overageUnits,
        idempotencyKey,
      });
      stripeMeterEventId = meterEvent.identifier;
      await markAiEventPosted(workspaceId, aiEventId, stripeMeterEventId);
    } else {
      await markAiEventPosted(workspaceId, aiEventId);
    }

    // --- Firestore writes for billing, usage, and ai_events ---
    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const dbAdmin = getFirestore();
    // Billing doc (ensure exists, update if needed)
    const billingRef = dbAdmin.doc(`/workspaces/${workspaceId}/billing`);
    await billingRef.set({
      stripeCustomerId,
      meteredAiEnabled: true,
      planKey,
    }, { merge: true });

    // Usage doc for current month
    const yyyyMM = new Date().toISOString().slice(0,7).replace("-", "");
    const usageRef = dbAdmin.doc(`/workspaces/${workspaceId}/usage/${yyyyMM}`);
    await usageRef.set({
      aiUsed: newUsed,
      aiIncluded: monthlyAiCredits,
    }, { merge: true });

    // AI event doc
    const aiEventRef = dbAdmin.doc(`/workspaces/${workspaceId}/ai_events/${aiEventId}`);
    await aiEventRef.set({
      agentKey: agentId,
      units: actionUnits,
      overageUnits,
      stripeMeterEventId,
      status: overageUnits > 0 ? "posted" : "reserved",
      createdAt: Timestamp.now(),
    });

    // 6. Always store audit log (can be expanded for more detail)
    // ...existing code for audit logging if present...
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Agent error." }, { status: 500 });
  }
}
