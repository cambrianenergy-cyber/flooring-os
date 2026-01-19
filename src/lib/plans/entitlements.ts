import { type PlanKey, resolvePlan } from "@/lib/plans";
import type { FeatureKey } from "./featureMatrix";

export type EntitlementInput = {
  planKey: PlanKey;
  feature?: FeatureKey;
  counts?: {
    agents?: number;
    workspaces?: number;
    workflowRunsThisMonth?: number;
  };
  isAdmin?: boolean;
};

export type EntitlementResult =
  | { ok: true }
  | { ok: false; code: "FEATURE_DISABLED" | "LIMIT_REACHED" | "INVALID_PLAN"; reason: string };

export function checkEntitlement(input: EntitlementInput): EntitlementResult {
  const { planKey, feature, counts, isAdmin = false } = input;

  if (isAdmin) return { ok: true };

  const plan = resolvePlan(planKey);
  const features = plan.features;
  if (!features) return { ok: false, code: "INVALID_PLAN", reason: "Invalid plan." };

  if (feature && !features[feature]) {
    return { ok: false, code: "FEATURE_DISABLED", reason: `Your plan does not include: ${feature}` };
  }

  const agents = counts?.agents ?? 0;
  if (typeof plan.maxUsers === "number" && agents > plan.maxUsers) {
    return { ok: false, code: "LIMIT_REACHED", reason: `Agent limit reached (${plan.maxUsers}).` };
  }

  // If you have maxWorkspaces in your plan, add similar logic here
  // const workspaces = counts?.workspaces ?? 0;
  // if (typeof plan.maxWorkspaces === "number" && workspaces > plan.maxWorkspaces) {
  //   return { ok: false, code: "LIMIT_REACHED", reason: `Workspace limit reached (${plan.maxWorkspaces}).` };
  // }

  const workflowRuns = counts?.workflowRunsThisMonth ?? 0;
  if (typeof plan.workflow?.maxRunsPerMonth === "number" && workflowRuns > plan.workflow.maxRunsPerMonth) {
    return {
      ok: false,
      code: "LIMIT_REACHED",
      reason: `Workflow run limit reached (${plan.workflow.maxRunsPerMonth}/mo).`,
    };
  }

  return { ok: true };
}
