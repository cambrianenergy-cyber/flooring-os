// Firestore data model for workspaces/{wid}/ai_rollups_monthly/{monthKey}
import type { Timestamp } from "firebase/firestore";

export interface AIRollupMonthly {
  monthKey: string; // YYYY-MM
  runs: number;
  tokensTotal: number;
  costUsd: number;
  capTokens: number;
  capRuns?: number;
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
