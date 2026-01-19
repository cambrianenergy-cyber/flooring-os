// Firestore data model for workspaces/{wid}/ai_events/{eventId}

export interface AIEvent {
  uid: string;
  agentKey: string;
  featureKey: string; // e.g. estimate_assist, scope_builder, followup_writer, objection_handler
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  createdAt: Date; // or Firebase Timestamp if used directly
  dayKey: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  estimateId?: string;
  leadId?: string;
  jobId?: string;
  secondsSaved?: number;
  outcome?: "accepted" | "sent" | string;
}
