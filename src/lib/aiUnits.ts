// src/lib/aiUnits.ts
// Default action units for each agent. Adjust as needed.
import type { AgentKey } from "@/lib/agents/registry";

export const AGENT_UNITS: Record<AgentKey, number> = {
  estimator: 1,
  scheduler: 1,
  inbox: 1,
  closer: 1,
  ops: 1,
  support: 1,
  leadScoring: 1,
  workflow: 1,
  proposalWriting: 1,
  closeRateAnalyst: 1,
  smartEstimator: 2,
  pricingOptimizer: 2,
  marginGuard: 1,
  estimateComparator: 1,
  workflowAutomation: 2,
  compliance: 1,
  crewCoordination: 1,
  delayDetection: 1,
  business_intelligence: 2,
};
