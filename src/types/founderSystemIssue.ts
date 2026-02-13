import { Timestamp } from "firebase/firestore";

export interface FounderSystemIssue {
  founderUserId: string;
  issueId: string;

  type:
    | "stripe_webhook_failed"
    | "docusign_webhook_failed"
    | "snapshot_job_failed"
    | "api_error"
    | "agent_failure";
  severity: "low" | "medium" | "high";

  workspaceId?: string;
  workspaceName?: string;

  message: string;
  context?: object;

  firstSeenAt: Timestamp;
  lastSeenAt: Timestamp;
  occurrences: number;

  status: "open" | "acknowledged" | "resolved";

  updatedAt: Timestamp;
  createdAt: Timestamp;
}
