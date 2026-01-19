// Firestore ai_usage collection type definition

export type AiUsageAction = "estimate_ai" | "workflow_run" | "pricing_calc";

export interface AiUsage {
  workspaceId: string;
  action: AiUsageAction;
  tokensUsed: number;
  createdAt: Date; // Use Date for Firestore Timestamp compatibility
}
