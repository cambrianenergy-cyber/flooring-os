import { NextRequest, NextResponse } from "next/server";
import { hasFeature, resolvePlan, type PlanKey } from "@/lib/plans";
import { runAgentOrchestrated } from "@/lib/agentOrchestrator";
import { rateLimit } from "@/lib/rateLimit";
import { adminDb } from "@/lib/firebaseAdmin";
import { normalizeAgentType } from "@/lib/normalizeAgentType";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);

function originAllowed(origin: string | null): boolean {
  if (!allowedOrigins.length) return true;
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

function startOfCurrentMonthUtc() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

function parseCap(value?: string | null) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function getUsage(workspaceId: string, agentId?: string) {
  const since = startOfCurrentMonthUtc();
  const db = adminDb();
  const snap = await db
    .collection("agent_runs")
    .where("workspaceId", "==", workspaceId)
    .where("createdAt", ">=", since)
    .orderBy("createdAt", "desc")
    .limit(500)
    .get();

  let usd = 0;
  let tokens = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as {
      agentId?: string;
      usdCost?: number;
      tokensIn?: number;
      tokensOut?: number;
    };
    if (agentId && data.agentId !== agentId) continue;
    usd += data.usdCost ?? 0;
    tokens += (data.tokensIn ?? 0) + (data.tokensOut ?? 0);
  }
  return { usd, tokens };
}

async function enforceSpendAndTokenCaps(workspaceId: string, agentId: string) {
  // (getPlan import moved to POST handler)
  const workspaceUsdCap = parseCap(process.env.AI_WORKSPACE_USD_CAP);
  const workspaceTokenCap = parseCap(process.env.AI_WORKSPACE_TOKEN_CAP);
  const agentUsdCap = parseCap(process.env.AI_AGENT_USD_CAP);
  const agentTokenCap = parseCap(process.env.AI_AGENT_TOKEN_CAP);

  if (!workspaceUsdCap && !workspaceTokenCap && !agentUsdCap && !agentTokenCap) {
    return;
  }

  const workspaceUsage = await getUsage(workspaceId);
  if (workspaceUsdCap && workspaceUsage.usd > workspaceUsdCap) {
    throw new Error("Workspace monthly AI spend cap exceeded.");
  }
  if (workspaceTokenCap && workspaceUsage.tokens > workspaceTokenCap) {
    throw new Error("Workspace monthly AI token cap exceeded.");
  }

  if (agentUsdCap || agentTokenCap) {
    const agentUsage = await getUsage(workspaceId, agentId);
    if (agentUsdCap && agentUsage.usd > agentUsdCap) {
      throw new Error("Agent monthly AI spend cap exceeded.");
    }
    if (agentTokenCap && agentUsage.tokens > agentTokenCap) {
      throw new Error("Agent monthly AI token cap exceeded.");
    }
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const userRole = body.userRole;
  const planKey = body.planKey as PlanKey | undefined;
  const workspaceId = body.workspaceId as string | undefined;
  const agentType = body.agentType || normalizeAgentType(body.userInput || "");
  const agentId = body.agentId || agentType;
  const env = process.env.APP_ENV || process.env.NODE_ENV || "dev";
  const origin = req.headers.get("origin");

  // AI metering: enforce credit budget before agent execution
  try {
    const { requireAiBudget } = await import("@/lib/metering");
    if (workspaceId) {
      await requireAiBudget(workspaceId);
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "AI_CREDITS_EXHAUSTED") {
      return NextResponse.json({ error: "Upgrade for more AI" }, { status: 402 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI metering error" }, { status: 403 });
  }

  if (!originAllowed(origin)) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }

  // Kill switch
  if (process.env.AGENT_KILL_SWITCH === "true") {
    return NextResponse.json({ error: "Agents are temporarily disabled." }, { status: 503 });
  }

  // Environment guard to prevent cross-env calls
  const requestEnv = req.headers.get("x-env") || env;
  if (requestEnv !== env) {
    return NextResponse.json({ error: "Environment mismatch." }, { status: 403 });
  }

  // API key guard (optional)
  if (process.env.AGENT_API_KEY) {
    const key = req.headers.get("x-agent-api-key");
    if (key !== process.env.AGENT_API_KEY) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }
  }

  // Rate limiting (per workspace or IP)
  const clientKey = workspaceId || req.headers.get("x-forwarded-for") || "anon";
  const rl = await rateLimit(clientKey, 30, 60_000); // 30 req/min
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  // Enforce subscription feature gating for AI endpoints
  if (!planKey || !hasFeature(planKey, "docusign")) {
    return NextResponse.json({ error: "AI access not enabled for this plan." }, { status: 403 });
  }

  // Enforce role-based execution (limit to manager+)
  const allowedRoles = ["owner", "admin", "manager"];
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: "Insufficient role to execute AI agents." }, { status: 403 });
  }

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }


  // Spend/token caps (workspace + agent)
  try {
    await enforceSpendAndTokenCaps(workspaceId, agentId);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Spend/token cap exceeded." }, { status: 429 });
  }

  // Plan-based AI credit enforcement with overage tracking
  let isOverage = false;
  let overageTokens = 0;
  try {
    // Get plan's monthly AI credit limit
    const plan = resolvePlan(planKey);
    const monthlyAiCredits = plan?.monthlyAiCredits;
    if (monthlyAiCredits && monthlyAiCredits > 0) {
      // Get usage for this workspace this month
      const usage = await getUsage(workspaceId);
      if (usage.tokens >= monthlyAiCredits) {
        // Allow overage: increment overage tokens in workspace doc
        isOverage = true;
        const overage = usage.tokens - monthlyAiCredits;
        overageTokens = overage > 0 ? overage : 0;
        // Update workspace doc with overage tokens
        const db = adminDb();
        await db.collection("workspaces").doc(workspaceId).set({
          aiOverageTokens: overageTokens,
          aiOverageUpdatedAt: new Date(),
        }, { merge: true });
      }
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI credit check failed." }, { status: 500 });
  }

  try {
    const result = await runAgentOrchestrated({
      workspaceId,
      agentType,
      agentId,
      planKey,
      userRole,
      toolKey: body.toolKey,
      instruction: body.userInput || body.instruction || "",
      context: body.context || {},
      triggerType: "user",
      allowedCollections: body.allowedCollections,
      targetScopes: { workflowId: body.workflowId, runId: body.runId, jobId: body.jobId, leadId: body.leadId },
    });
    // Attach overage info to response if in overage
    if (isOverage) {
      return NextResponse.json({ ...result, aiOverage: true, overageTokens });
    }
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Agent failed" }, { status: 400 });
  }
}
