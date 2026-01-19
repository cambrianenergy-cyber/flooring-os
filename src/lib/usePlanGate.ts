import { resolvePlan, hasFeature, PlanKey, PlanFeatures } from "@/lib/plans";

export function usePlanGate(planKey: PlanKey) {
  const plan = resolvePlan(planKey);
  const features = plan.features;
  return {
    canUseAgent: (currentAgents: number) => {
      if (plan.maxUsers === "unlimited") return true;
      return currentAgents < plan.maxUsers;
    },
    // No maxWorkspaces in plan, so always true
    canUseWorkspace: (_currentWorkspaces: number) => true,
    canUseWorkflowRun: (currentWorkflowRuns: number) => {
      if (plan.workflow.maxRunsPerMonth === "unlimited") return true;
      return currentWorkflowRuns < plan.workflow.maxRunsPerMonth;
    },
    isFeatureEnabled: (feature: keyof PlanFeatures) => hasFeature(planKey, feature),
    features,
  };
}
