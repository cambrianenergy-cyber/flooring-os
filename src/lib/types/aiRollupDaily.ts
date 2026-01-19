// Firestore data model for workspaces/{wid}/ai_rollups_daily/{dayKey}
import type { Timestamp } from "firebase/firestore";

export interface AIRollupDaily {
  dayKey: string; // YYYY-MM-DD
  runs: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  byFeature: Record<string, {
    runs: number;
    tokens: number;
    costUsd: number;
  }>;
  byUser: Record<string, {
    runs: number;
    tokens: number;
    costUsd: number;
  }>;
  updatedAt: Timestamp;
}
