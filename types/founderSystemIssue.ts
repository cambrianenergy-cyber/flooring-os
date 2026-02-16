export type FounderSystemIssue = {
  id?: string;
  issueId?: string;
  workspaceId?: string;
  workspaceName?: string;
  type?: string; // e.g. 'agent_failure'
  message?: string;
  occurrences?: number;
  lastSeenAt?: { seconds: number; nanoseconds?: number };
  [key: string]: unknown;
};
