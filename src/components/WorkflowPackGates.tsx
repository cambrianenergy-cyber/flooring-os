import {
  hasZeroLeadLeakPack,
  hasInstantLeadResponsePack,
  hasFollowUpCadencePack,
  hasDeadLeadRecoveryPack,
} from "@/lib/pricingTiers";
import { useWorkspace } from "../lib/workspaceContext";
import React from "react";

export function ZeroLeadLeakPackPackGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  const subscription = {
    activeAddOns: workspace.plan.activeAddOns || [],
    tier: workspace.plan.tier || workspace.plan.key,
  };
  return hasZeroLeadLeakPack(subscription) ? <>{children}</> : <>{fallback || null}</>;
}

export function InstantLeadResponsePackGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  const subscription = {
    activeAddOns: workspace.plan.activeAddOns || [],
    tier: workspace.plan.tier || workspace.plan.key,
  };
  return hasInstantLeadResponsePack(subscription) ? <>{children}</> : <>{fallback || null}</>;
}

export function FollowUpCadencePackGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  const subscription = {
    activeAddOns: workspace.plan.activeAddOns || [],
    tier: workspace.plan.tier || workspace.plan.key,
  };
  return hasFollowUpCadencePack(subscription) ? <>{children}</> : <>{fallback || null}</>;
}

export function DeadLeadRecoveryPackGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  const subscription = {
    activeAddOns: workspace.plan.activeAddOns || [],
    tier: workspace.plan.tier || workspace.plan.key,
  };
  return hasDeadLeadRecoveryPack(subscription) ? <>{children}</> : <>{fallback || null}</>;
}
