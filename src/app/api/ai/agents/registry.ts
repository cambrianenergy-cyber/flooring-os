import { workflowAutomationAgentMeta } from "./workflowAutomation";
import { businessIntelligenceAgentMeta } from "./businessIntelligence";
import { complianceAgentMeta } from "./compliance";
import { crewCoordinationAgentMeta } from "./crewCoordination";
import { delayDetectionAgentMeta } from "./delayDetection";
import { smartEstimatorAgentMeta } from "./smartEstimator";
import { pricingOptimizerAgentMeta } from "./pricingOptimizer";
import { marginGuardAgentMeta } from "./marginGuard";
import { estimateComparatorAgentMeta } from "./estimateComparator";
// src/app/api/ai/agents/registry.ts


import { estimatorAgentMeta } from "./estimator";
import { followUpAgentMeta } from "./followUp";
import { materialsAgentMeta } from "./materials";
import { jobSummaryAgentMeta } from "./jobSummary";
import { kpiAgentMeta } from "./kpi";
import { schedulingAgentMeta } from "./scheduling";
import { calendarAgentMeta } from "./calendar";
import { trainingTipsAgentMeta } from "./trainingTips";
import { remindersAgentMeta } from "./reminders";
import { leadScoringAgentMeta } from "./leadScoring";
import { documentGenAgentMeta } from "./documentGen";
import { proposalWritingAgentMeta } from "./proposalWriting";
import { closeRateAnalystAgentMeta } from "./closeRateAnalyst";

// Export a registry array of all agent meta objects
export const agentRegistry = [
  estimatorAgentMeta,
  followUpAgentMeta,
  materialsAgentMeta,
  jobSummaryAgentMeta,
  kpiAgentMeta,
  schedulingAgentMeta,
  calendarAgentMeta,
  trainingTipsAgentMeta,
  remindersAgentMeta,
  leadScoringAgentMeta,
  documentGenAgentMeta,
  proposalWritingAgentMeta,
  closeRateAnalystAgentMeta,
  smartEstimatorAgentMeta,
  pricingOptimizerAgentMeta,
  marginGuardAgentMeta,
  estimateComparatorAgentMeta,
  workflowAutomationAgentMeta,
  complianceAgentMeta,
  crewCoordinationAgentMeta,
  delayDetectionAgentMeta,
  businessIntelligenceAgentMeta,
];
