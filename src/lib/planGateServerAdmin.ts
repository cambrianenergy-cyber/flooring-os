import { PLANS, type PlanKey, type PlanFeatures } from "@/lib/plans";

export type PlanGateInput = {
  planKey: PlanKey;
  currentAgents: number;
  currentWorkflowRunsThisMonth: number;
  tool: keyof PlanFeatures; // e.g. "aiAgents" | "workflows" | "unifiedInbox" etc.
  isAdmin?: boolean;
};

export type PlanGateResult =
  | { ok: true }
  | { ok: false; reason: string; code: "FEATURE_DISABLED" | "LIMIT_REACHED" };

export function gatePlanServerAdmin(input: PlanGateInput): PlanGateResult {
  const {
    planKey,
    currentAgents,
    currentWorkflowRunsThisMonth,
    tool,
    isAdmin = false,
  } = input;

  // Admin bypass (founder / internal ops)
  if (isAdmin) return { ok: true };

  const plan = PLANS[planKey];
  if (!plan) return { ok: false, code: "FEATURE_DISABLED", reason: "Invalid plan." };

  const f = plan.features;

  // 1) Feature flag gating
  const enabled = Boolean(f[tool]);
  if (!enabled) {
    return {
      ok: false,
      code: "FEATURE_DISABLED",
      reason: `Your plan does not include: ${String(tool)}`,
    };
  }

  // 2) Limit gating (only when relevant)
  if (typeof plan.maxUsers === "number" && currentAgents > plan.maxUsers) {
    return {
      ok: false,
      code: "LIMIT_REACHED",
      reason: `Agent limit reached (${plan.maxUsers}). Upgrade to add more agents.`,
    };
  }

  if (
    typeof plan.workflow?.maxRunsPerMonth === "number" &&
    currentWorkflowRunsThisMonth > plan.workflow.maxRunsPerMonth
  ) {
    return {
      ok: false,
      code: "LIMIT_REACHED",
      reason: `Workflow run limit reached (${plan.workflow.maxRunsPerMonth}/mo). Upgrade for more runs.`,
    };
  }

  return { ok: true };
}

