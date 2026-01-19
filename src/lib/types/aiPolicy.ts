// Firestore data model for workspaces/{wid}/ai_policy/current
import type { Timestamp } from "firebase/firestore";

export interface AIPolicy {
  planKey: string;
  period: "monthly";
  capTokens: number;
  capRuns?: number;
  softLimitTokens: number;
  overageEnabled: boolean;
  featureAccess: Record<string, boolean>;
  updatedAt: Timestamp;
}
