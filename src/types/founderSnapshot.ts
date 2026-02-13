import { Timestamp } from "firebase/firestore";

export interface FounderSnapshot {
  founderUserId: string;
  snapshotId: string;
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalUsers: number;
  agentRuns30d: number;
  totalMRRCents?: number;
  totalRevenueCents?: number;
  churnRatePct?: number;
  createdAt: Timestamp;
}
