export type AgentKey =
  | "estimator"
  | "scheduler"
  | "inbox"
  | "closer"
  | "ops"
  | "support"
  | "leadScoring"
  | "workflow"
  | "proposalWriting"
  | "closeRateAnalyst"
  | "smartEstimator"
  | "pricingOptimizer"
  | "marginGuard"
  | "estimateComparator"
  | "workflowAutomation"
  | "compliance"
  | "crewCoordination"
  | "delayDetection"
  | "business_intelligence";

export const AGENTS: Record<
  AgentKey,
  {
    key: AgentKey;
    name: string;
    description: string;
  }
> = {
  smartEstimator: {
    key: "smartEstimator",
    name: "Smart Estimator Agent",
    description: "Generates estimates from job data, adjusts for complexity & layout, normalizes pricing across crews.",
  },
  pricingOptimizer: {
    key: "pricingOptimizer",
    name: "Pricing Optimizer Agent",
    description: "Suggests price ranges, compares historical jobs, warns underpricing risk.",
  },
  marginGuard: {
    key: "marginGuard",
    name: "Margin Guard Agent",
    description: "Flags thin-margin jobs, detects labor/material imbalance, recommends corrections before sending.",
  },
  estimateComparator: {
    key: "estimateComparator",
    name: "Estimate Comparator Agent",
    description: "Compares estimates side-by-side, shows price vs close probability, learns from past wins/losses.",
  },
  estimator: {
    key: "estimator",
    name: "Estimator",
    description: "Builds estimates, line items, materials, pricing.",
  },
  scheduler: {
    key: "scheduler",
    name: "Scheduler",
    description: "Schedules jobs, assigns crews, sets dates.",
  },
  inbox: {
    key: "inbox",
    name: "Unified Inbox",
    description: "Triages incoming messages and routes tasks.",
  },
  closer: {
    key: "closer",
    name: "Closer",
    description: "Handles objections and closes the deal.",
  },
  ops: {
    key: "ops",
    name: "Ops",
    description: "Operational checklists, QA, job readiness.",
  },
  support: {
    key: "support",
    name: "Support",
    description: "Customer support responses and troubleshooting.",
  },
  leadScoring: {
    key: "leadScoring",
    name: "Lead Scoring",
    description: "Analyzes leads and suggests which to prioritize based on likelihood to close.",
  },
  workflow: {
    key: "workflow",
    name: "Workflow",
    description: "Automates and tracks business workflows.",
  },
  proposalWriting: {
    key: "proposalWriting",
    name: "Proposal Writing Agent",
    description: "Writes professional proposals, adjusts tone, and rewrites objections automatically.",
  },
  closeRateAnalyst: {
    key: "closeRateAnalyst",
    name: "Close Rate Analyst",
    description: "Tracks win/loss reasons, compares pricing vs close rate, identifies sales leaks.",
  },
  business_intelligence: {
    key: "business_intelligence",
    name: "Business Intelligence Agent",
    description: "Cross-analyzes sales, ops, and estimates. Identifies systemic weaknesses and recommends strategic improvements.",
  },
  workflowAutomation: {
    key: "workflowAutomation",
    name: "Workflow Automation Agent",
    description: "Executes job transitions automatically, moves jobs based on status changes, eliminates manual admin work.",
  },
  compliance: {
    key: "compliance",
    name: "Compliance Agent",
    description: "Checks permits & requirements, flags missing documentation, prevents last-minute delays.",
  },
  crewCoordination: {
    key: "crewCoordination",
    name: "Crew Coordination Agent",
    description: "Assigns crews intelligently, balances workload, detects crew inefficiencies.",
  },
  delayDetection: {
    key: "delayDetection",
    name: "Delay Detection Agent",
    description: "Detects schedule slippage, alerts owners early, recommends fixes.",
  },
};
