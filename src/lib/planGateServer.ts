import { hasFeature, resolvePlan, PlanKey, PlanFeatures } from "@/lib/plans";

export function checkPlanGate({
  planKey,
  currentAgents = 0,
  currentWorkspaces = 0,
  currentWorkflowRunsThisMonth = 0,
  tool,
}: {
  planKey: PlanKey;
  currentAgents?: number;
  currentWorkspaces?: number;
  currentWorkflowRunsThisMonth?: number;
  tool?: keyof PlanFeatures;
}) {
  const plan = resolvePlan(planKey);
  const features = plan.features;
  // If you have maxAgents, maxWorkspaces, maxWorkflowRunsPerMonth in features, check them; otherwise, skip
  if ((features as any).maxAgents && currentAgents > (features as any).maxAgents) {
    return { allowed: false, reason: "max_agents" };
  }
  if ((features as any).maxWorkspaces && currentWorkspaces > (features as any).maxWorkspaces) {
    return { allowed: false, reason: "max_workspaces" };
  }
  if ((features as any).maxWorkflowRunsPerMonth && currentWorkflowRunsThisMonth > (features as any).maxWorkflowRunsPerMonth) {
    return { allowed: false, reason: "max_workflow_runs" };
  }
  if (tool && !hasFeature(planKey, tool)) {
    return { allowed: false, reason: "tool_not_enabled" };
  }
  return { allowed: true };
}
