import { Timestamp } from "firebase/firestore";

export interface Workspace {
  founderUserId: string;
  workspaceId: string;
  workspaceName: string;
  industry: string;
  mrrCents?: number;
  totalRevenueCents?: number;
  activeUsers?: number;
  activeReps?: number;
  estimates30d?: number;
  contracts30d?: number;
  wins30d?: number;
  health: "green" | "yellow" | "red";
  updatedAt: Timestamp;
  createdAt: Timestamp;
}
