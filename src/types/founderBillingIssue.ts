import { Timestamp } from "firebase/firestore";

export interface FounderBillingIssue {
  founderUserId: string;
  workspaceId: string;
  workspaceName: string;
  industry: string;

  status: "past_due" | "canceled" | "trialing" | "inactive";
  planId?: string;

  stripeCustomerId?: string;
  stripePriceId?: string;

  amountDueCents?: number;
  lastInvoiceAt?: Timestamp;

  updatedAt: Timestamp;
  createdAt: Timestamp;
}
