import { Timestamp } from "firebase/firestore";

export interface FounderMetrics {
  founderUserId: string;
  dateId: string; // YYYY-MM-DD

  totalMRRCents: number;
  totalRevenueCents: number;

  activeWorkspaces: number;
  activeUsers: number;

  estimatesCount: number;
  contractsCount: number;
  signedCount: number;

  closeRatePct: number; // signed / contracts (primary definition)

  agentRunsCount: number;
  agentFailuresCount: number;

  pastDueCount: number;
  docusignStuckCount: number;
  webhookFailuresCount: number;

  createdAt: Timestamp;
}
