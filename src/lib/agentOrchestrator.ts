// --- AI ACTION COST MAP ---
// Square Flooring — AI Action Cost Map (Per Agent)
//
// How AI Actions Are Counted (Ground Rules)
// 1 AI Action ≠ 1 message
// Actions are charged based on:
//   - data processed
//   - reasoning depth
//   - business impact
// Some agents are light-touch, some are heavy intelligence.
// This prevents abuse and protects margins.
//
// CORE WORKFLOW AGENTS (Included – Low Cost)
// Job Intake Agent: 1 AI action / run
//   Why: Structured extraction, low reasoning depth.
// Scheduling Agent: 1 AI action / run
//   Why: Rule-based logic + light optimization.
// Material Prep Agent: 2 AI actions / run
//   Why: Calculations + waste buffers + material logic.
// Job Organizer Agent: 1 AI action / run
//   Why: Classification, tagging, alerts.
//
// SALES ACCELERATOR PACK
// Lead Qualification Agent: 1 AI action / lead
//   Why: Scoring + intent detection.
// Proposal Writing Agent: 3 AI actions / proposal
//   Why: Natural language generation + tone control.
// Follow-Up Agent: 1 AI action / follow-up
//   Why: Script generation, low context depth.
// Close Rate Analyst: 5 AI actions / analysis run
//   Why: Cross-job pattern recognition + historical comparison.
//
// ESTIMATION POWER PACK (High-Value Intelligence)
// Smart Estimator Agent: 4 AI actions / estimate
//   Why: Layout logic + normalization + sqft complexity.
// Pricing Optimizer Agent: 5 AI actions / optimization
//   Why: Margin logic + historical job comparison.
// Margin Guard Agent: 3 AI actions / check
//   Why: Cost structure validation + risk detection.
// Estimate Comparator Agent: 6 AI actions / comparison
//   Why: Multi-estimate analysis + probability modeling.

// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";
// const db = adminDb();
import type { Firestore } from "firebase-admin/firestore";
const db = {} as Firestore; // static export stub
import { getAgentExecutor } from "@/lib/agentExecutors";
import { deductAiActions } from "@/lib/deductAiActions";
import { logAgentFailure } from "@/lib/observability";
import { hasFeature, PlanKey } from "@/lib/plans";
import { Agent, AgentRun } from "@/lib/types";
import { logAuditEvent } from "@/lib/observability";
import type { DocumentReference } from "firebase-admin/firestore";

// --- AI ACTION COST ENFORCEMENT ---
// Map agentId to AI action cost (enforced per run)
const AGENT_ACTION_COST: Record<string, { cost: number; unit: string }> = {
  // Core Workflow Agents
  estimator: { cost: 1, unit: "run" },
  scheduling: { cost: 1, unit: "run" },
  materials: { cost: 2, unit: "run" },
  jobSummary: { cost: 1, unit: "run" },
  // Sales Accelerator Pack
  leadQualification: { cost: 1, unit: "lead" },
  proposalWriting: { cost: 3, unit: "proposal" },
  followUp: { cost: 1, unit: "follow-up" },
  closeRateAnalyst: { cost: 5, unit: "analysis run" },
  // Estimation Power Pack
  smartEstimator: { cost: 4, unit: "estimate" },
  pricingOptimizer: { cost: 5, unit: "optimization" },
  marginGuard: { cost: 3, unit: "check" },
  estimateComparator: { cost: 6, unit: "comparison" },
  // Operations Automation Pack
  workflowAutomation: { cost: 1, unit: "transition" },
  compliance: { cost: 2, unit: "audit" },
  crewCoordination: { cost: 3, unit: "assignment" },
  delayDetection: { cost: 2, unit: "scan" },
  // Full Suite / Advanced Intelligence
  business_intelligence: { cost: 8, unit: "report" },
  // Elite / Premium Agents (Future-Proofed)
  marketExpansion: { cost: 10, unit: "analysis" },
  competitiveIntelligence: { cost: 12, unit: "report" },
  hiringReadiness: { cost: 6, unit: "assessment" },
};

export type AgentDispatchInput = {
  workspaceId: string;
  agentType: string;
  agentId?: string; // optional stable id; falls back to agentType
  toolKey?: string; // tool the agent intends to call, if applicable
  planKey: PlanKey;
  userRole: string;
  context?: Record<string, unknown>;
  instruction: string;
  triggerType?: "user" | "workflow" | "system" | "schedule";
  maxAttempts?: number;
  allowedCollections?: string[]; // optional allow-list the caller declares
  targetScopes?: { workflowId?: string; runId?: string; jobId?: string; leadId?: string };
};

const ALLOWED_ROLES = ["owner", "admin", "manager"];

type AgentPermissionDoc = {
  scope: "workspace" | "job" | "lead" | "contact" | "system";
  scopeId?: string | null;
  conditions?: { allowedCollections?: string[] };
  toolKey?: string;
};

type AgentStats = {
  totalRuns: number;
  successes: number;
  failures: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalUsd: number;
  latencyMsSum: number;
  latencySamples: number;
  lastRunUsd: number | null;
};

const MONTH_RUN_LOOKBACK = 200;

function startOfCurrentMonthUtc() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

async function fetchAgentDoc(workspaceId: string, agentId: string) {
  // db already declared above for workspace checks
  const agentRef = db.collection("agents").doc(agentId);
  const snap = await agentRef.get();
  if (!snap.exists) throw new Error("Agent not found.");
  const agent = snap.data() as Agent;
  if (agent.workspaceId && agent.workspaceId !== workspaceId) {
    throw new Error("Agent does not belong to this workspace.");
  }
  return { agent, agentRef };
}

async function computeAgentMonthlyStats(workspaceId: string, agentId: string): Promise<AgentStats> {
  const monthStart = startOfCurrentMonthUtc();
  const snap = await db
    .collection("agent_runs")
    .where("workspaceId", "==", workspaceId)
    .where("agentId", "==", agentId)
    .orderBy("createdAt", "desc")
    .limit(MONTH_RUN_LOOKBACK)
    .get();

  const base: AgentStats = {
    totalRuns: 0,
    successes: 0,
    failures: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalUsd: 0,
    latencyMsSum: 0,
    latencySamples: 0,
    lastRunUsd: null,
  };

  for (const doc of snap.docs) {
    const data = doc.data() as AgentRun;
    if (!data.createdAt || data.createdAt < monthStart) break;

    base.totalRuns += 1;
    if (data.status === "succeeded") base.successes += 1;
    if (data.status === "failed") base.failures += 1;
    base.totalTokensIn += data.tokensIn ?? 0;
    base.totalTokensOut += data.tokensOut ?? 0;
    base.totalUsd += data.usdCost ?? 0;
    if (data.durationMs != null) {
      base.latencyMsSum += data.durationMs;
      base.latencySamples += 1;
    }
    if (base.lastRunUsd === null && data.usdCost != null) {
      base.lastRunUsd = data.usdCost;
    }
  }

  return base;
}

async function enforceTerminationThresholds(
  workspaceId: string,
  agentId: string,
  agent: Agent,
  agentRef: DocumentReference,
  stats: AgentStats,
  agentType: string,
  toolKey?: string
) {
  const now = Date.now();

  if (agent.status === "disabled" || agent.termination?.disabledAt) {
    throw new Error("Agent is disabled.");
  }

  const thresholds = agent.termination?.thresholds;
  if (!thresholds) return;

  const failureRate = stats.totalRuns > 0 ? stats.failures / stats.totalRuns : 0;
  const monthTokens = stats.totalTokensIn + stats.totalTokensOut;

  const violations: string[] = [];
  if (thresholds.maxFailureRate != null && failureRate > thresholds.maxFailureRate) {
    violations.push("failure_rate");
  }
  if (thresholds.maxUsdPerMonth != null && stats.totalUsd > thresholds.maxUsdPerMonth) {
    violations.push("usd_spend");
  }
  if (thresholds.maxTokensPerMonth != null && monthTokens > thresholds.maxTokensPerMonth) {
    violations.push("token_spend");
  }

  if (violations.length === 0) return;

  await agentRef.set(
    {
      status: "disabled",
      termination: {
        ...(agent.termination ?? {}),
        disabledAt: now,
        disabledReason: `terminated:${violations.join(",")}`,
      },
      updatedAt: now,
    },
    { merge: true }
  );

  await logAuditEvent({
    workspaceId,
    actorType: "agent",
    actorId: agentId,
    action: "agent.terminated",
    entityType: "agents",
    entityId: agentId,
    meta: { agentType, toolKey, violations, failureRate, monthUsd: stats.totalUsd, monthTokens },
  });

  throw new Error("Agent terminated due to policy thresholds.");
}

async function updateAgentMetrics(
  workspaceId: string,
  agentId: string,
  agentRef: DocumentReference
) {
  const stats = await computeAgentMonthlyStats(workspaceId, agentId);
  const totalRuns = stats.totalRuns || 0;
  const successRate = totalRuns > 0 ? stats.successes / totalRuns : 0;
  const avgLatencyMs = stats.latencySamples > 0 ? stats.latencyMsSum / stats.latencySamples : null;
  const avgTokensIn = totalRuns > 0 ? stats.totalTokensIn / totalRuns : null;
  const avgTokensOut = totalRuns > 0 ? stats.totalTokensOut / totalRuns : null;
  const now = Date.now();

  await agentRef.set(
    {
      performance: {
        successRate,
        avgLatencyMs,
        avgTokensIn,
        avgTokensOut,
        lastEvaluatedAt: now,
      },
      costAttribution: {
        lastRunUsd: stats.lastRunUsd,
        monthToDateUsd: stats.totalUsd,
      },
      updatedAt: now,
    },
    { merge: true }
  );
}

async function ensurePermission(
  workspaceId: string,
  agentId: string,
  toolKey: string | undefined,
  allowedCollections?: string[],
  targetScopes?: { workflowId?: string; runId?: string; jobId?: string; leadId?: string }
) {
  let q = db
    .collection("agent_permissions")
    .where("workspaceId", "==", workspaceId)
    .where("agentId", "==", agentId)
    .where("allowed", "==", true);

  // If a toolKey is provided, filter permissions by toolKey (or null/absent permissions)
  if (toolKey) {
    q = q.where("toolKey", "in", [toolKey, null]);
  }

  const snap = await q.get();
  if (snap.empty) throw new Error("Agent not permitted in this workspace.");

  // Choose the most specific permission: first with matching toolKey, else fallback
  const permDoc = snap.docs.find((d) => (d.data() as AgentPermissionDoc).toolKey === toolKey) ?? snap.docs[0];
  const perm = permDoc.data() as AgentPermissionDoc;

  // Tool enforcement: if permission specifies a toolKey, require match
  if (perm.toolKey && toolKey && perm.toolKey !== toolKey) {
    throw new Error("Agent not permitted for this tool.");
  }

  // Scope enforcement: if permission is scoped, ensure target scopes match
  if (perm.scope && perm.scope !== "workspace") {
    const targetId =
      perm.scope === "job" ? targetScopes?.jobId :
      perm.scope === "lead" ? targetScopes?.leadId :
      perm.scope === "contact" ? targetScopes?.leadId : null;
    if (perm.scopeId && perm.scopeId !== targetId) {
      throw new Error("Agent scope does not match target entity.");
    }
  }

  // Collection allow-list enforcement when provided
  if (perm.conditions?.allowedCollections) {
    if (!allowedCollections || allowedCollections.length === 0) {
      throw new Error("Agent requires collection allow-list but none was provided.");
    }
    const allowedSet = new Set(perm.conditions.allowedCollections);
    const allAllowed = allowedCollections.every((c) => allowedSet.has(c));
    if (!allAllowed) throw new Error("Agent not permitted for requested collections.");
  }
}

export async function runAgentOrchestrated(input: AgentDispatchInput) {
  const {
    workspaceId,
    agentType,
    agentId = agentType,
    planKey,
    userRole,
    context = {},
    instruction,
    triggerType = "user",
    maxAttempts = 2,
    toolKey,
    allowedCollections,
    targetScopes,
  } = input;

  // --- AI ACTION COST ENFORCEMENT & METERING ---
  const agentCost = AGENT_ACTION_COST[agentId];
  if (!agentCost) {
    throw new Error(`AI action cost not defined for agent: ${agentId}`);
  }
  // Deduct from workspace quota (throws if exceeded)
  await deductAiActions(workspaceId, agentCost.cost);
  // 1. Check for AI feature using a valid PlanFeatures key
  if (!hasFeature(planKey, "apiAccess")) {
    throw new Error("AI agents are not enabled for this plan.");
  }

  // 2. Role enforcement
  if (!ALLOWED_ROLES.includes(userRole)) {
    throw new Error("Insufficient role to run this agent.");
  }

  // 3. Workflow pack enforcement (agent only runs if workflow pack is active for workspace)
  // (Assume workspace doc has activeWorkflowPacks: string[])
  // db is declared at module scope
  const workspaceDoc = await db.collection("workspaces").doc(workspaceId).get();
  const activeWorkflowPacks: string[] = (workspaceDoc.exists && Array.isArray(workspaceDoc.data()?.activeWorkflowPacks)) ? workspaceDoc.data()!.activeWorkflowPacks : [];
  // Map agentId to required workflow pack (for strict enforcement)
  // This mapping should be maintained for all agents
  const agentToPack: Record<string, string> = {
    // Core Workflow Agents
    estimator: "core_workflow_pack",
    scheduling: "core_workflow_pack",
    materials: "core_workflow_pack",
    jobSummary: "core_workflow_pack",
    // Sales Accelerator Pack
    leadQualification: "sales_accelerator_pack",
    proposalWriting: "sales_accelerator_pack",
    followUp: "sales_accelerator_pack",
    closeRateAnalyst: "sales_accelerator_pack",
    // Estimation Power Pack
    smartEstimator: "estimation_power_pack",
    pricingOptimizer: "estimation_power_pack",
    marginGuard: "estimation_power_pack",
    estimateComparator: "estimation_power_pack",
    // Operations Automation Pack
    workflowAutomation: "operations_automation_pack",
    compliance: "operations_automation_pack",
    crewCoordination: "operations_automation_pack",
    delayDetection: "operations_automation_pack",
    // Full Suite / Advanced Intelligence
    business_intelligence: "full_workflow_suite_pack",
    // Elite / Premium Agents (Future-Proofed)
    marketExpansion: "elite_premium_pack",
    competitiveIntelligence: "elite_premium_pack",
    hiringReadiness: "elite_premium_pack",
  };
  const requiredPack = agentToPack[agentId];
  if (requiredPack && !activeWorkflowPacks.includes(requiredPack)) {
    throw new Error("This agent requires an active workflow pack. Please upgrade or activate the required pack.");
  }

  // 4. AI usage enforcement is handled by orchestrator route metering

  // 5. Plan allows agent type (enforced by planKey and feature checks above)

  // 6. Audit: all executions are logged below (see logAuditEvent)

  // 7. Workspace scope: ensurePermission enforces this

  await ensurePermission(workspaceId, agentId, toolKey, allowedCollections, targetScopes);

  const { agent, agentRef } = await fetchAgentDoc(workspaceId, agentId);
  const preRunStats = await computeAgentMonthlyStats(workspaceId, agentId);
  await enforceTerminationThresholds(workspaceId, agentId, agent, agentRef, preRunStats, agentType, toolKey);

  const runRef = db.collection("agent_runs").doc();
  const baseRun: AgentRun = {
    workspaceId,
    agentId,
    taskId: null,
    triggerType,
    triggerContext: { userRole },
    status: "running",
    startedAt: Date.now(),
    finishedAt: null,
    durationMs: null,
    input: { instruction, context },
    output: null,
    error: null,
    tokensIn: 0,
    tokensOut: 0,
    usdCost: null,
    model: null,
    correlationId: runRef.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await runRef.set(baseRun);

  // Employment-style audit: agent started a job
  await logAuditEvent({
    workspaceId,
    actorType: "agent",
    actorId: agentId,
    action: "agent_run.started",
    entityType: "agent_runs",
    entityId: runRef.id,
    meta: { agentType, toolKey, triggerType, instruction: instruction?.slice(0, 200) },
  });

  const exec = getAgentExecutor(agentType);
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await exec({ workspaceId, instruction, context, stepIndex: 0, stepId: "adhoc" });
      const finishedAt = Date.now();
      await runRef.update({
        status: "succeeded",
        output: res.output ?? null,
        finishedAt,
        durationMs: finishedAt - (baseRun.startedAt ?? finishedAt),
        updatedAt: finishedAt,
        tokensIn: res.tokensIn ?? 0,
        tokensOut: res.tokensOut ?? 0,
        model: res.model ?? null,
        usdCost: res.usdCost ?? null,
      });

      await logAuditEvent({
        workspaceId,
        actorType: "agent",
        actorId: agentId,
        action: "agent_run.succeeded",
        entityType: "agent_runs",
        entityId: runRef.id,
        meta: { agentType, toolKey, durationMs: finishedAt - (baseRun.startedAt ?? finishedAt) },
      });

      await updateAgentMetrics(workspaceId, agentId, agentRef);
      return res;
    } catch (err: unknown) {
      lastError = err;
      if (attempt < maxAttempts) {
        continue;
      }
      const finishedAt = Date.now();
      let message: string;
      let stack: string | null = null;
      if (typeof err === "object" && err !== null && "message" in err) {
        message = String((err as { message: unknown }).message);
        stack = "stack" in err ? String((err as { stack?: unknown }).stack) : null;
      } else {
        message = String(err);
      }
      await runRef.update({
        status: "failed",
        error: { message, stack, retriable: false },
        finishedAt,
        durationMs: finishedAt - (baseRun.startedAt ?? finishedAt),
        updatedAt: finishedAt,
      });

      await logAgentFailure({
        workspaceId,
        runId: runRef.id,
        agentId,
        level: "error",
        message,
        payload: { attempt, agentType },
        stepId: null,
        spanId: null,
        createdAt: finishedAt,
        updatedAt: finishedAt,
      });

      await logAuditEvent({
        workspaceId,
        actorType: "agent",
        actorId: agentId,
        action: "agent_run.failed",
        entityType: "agent_runs",
        entityId: runRef.id,
        meta: { agentType, toolKey, attempt, maxAttempts, message },
      });

      await updateAgentMetrics(workspaceId, agentId, agentRef);
    }
  }

  throw lastError ?? new Error("Agent failed");
}
