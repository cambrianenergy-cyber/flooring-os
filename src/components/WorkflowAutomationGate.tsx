import { hasWorkflowAutomation } from "@/lib/pricingTiers";
import { useWorkspace } from "@/lib/workspaceContext";
import React from "react";

/**
 * <WorkflowAutomationGate>
 *   <WorkflowUI />
 * </WorkflowAutomationGate>
 *
 * Only renders children if the workspace has the Workflow Automation add-on.
 */
export function WorkflowAutomationGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  return hasWorkflowAutomation(workspace.plan) ? <>{children}</> : <>{fallback || null}</>;
}
