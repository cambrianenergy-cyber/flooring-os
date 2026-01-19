import { hasComplianceAutomation, hasWhiteLabelBranding, hasMultiLocationIntelligence } from "@/lib/pricingTiers";
import { useWorkspace } from "@/lib/workspaceContext";
import React from "react";

export function ComplianceAutomationGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  return hasComplianceAutomation(workspace.plan) ? <>{children}</> : <>{fallback || null}</>;
}

export function WhiteLabelBrandingGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  return hasWhiteLabelBranding(workspace.plan) ? <>{children}</> : <>{fallback || null}</>;
}

export function MultiLocationIntelligenceGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  return hasMultiLocationIntelligence(workspace.plan) ? <>{children}</> : <>{fallback || null}</>;
}
