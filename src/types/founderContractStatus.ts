import { Timestamp } from "firebase/firestore";

export interface FounderContractStatus {
  founderUserId: string;
  contractId: string;
  workspaceId: string;
  workspaceName: string;

  customerName?: string;
  salesRepName?: string;

  status: "sent" | "delivered" | "signed" | "declined" | "voided" | "error";
  sentAt?: Timestamp;
  signedAt?: Timestamp;

  stuckDays: number; // computed server-side
  envelopeId?: string;

  error?: { code?: string; message?: string };

  updatedAt: Timestamp;
  createdAt: Timestamp;
}
