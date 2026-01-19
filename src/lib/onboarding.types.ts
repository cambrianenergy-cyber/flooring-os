// src/lib/onboarding.types.ts
import { Timestamp } from "firebase/firestore";

export interface AIEvent {
  uid: string;
  agentKey: string;
  featureKey: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  createdAt: Timestamp; // Use Timestamp from Firestore
  dayKey: string;
  monthKey: string;
}

export interface AIRollupDaily {
  dayKey: string;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  eventCount: number;
  updatedAt: Timestamp; // Use Timestamp from Firestore
}

export interface AIRollupMonthly {
  monthKey: string;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  eventCount: number;
  updatedAt: Timestamp; // Use Timestamp from Firestore
}

export interface AuditLog {
  type: string;
  uid: string;
  severity: "info" | "warn" | "error";
  entity: {
    kind: string;
    id: string;
  };
  meta: { [key: string]: unknown };
  createdAt: Timestamp; // Use Timestamp from Firestore
}
