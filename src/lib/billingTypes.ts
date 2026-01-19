// src/lib/billingTypes.ts
export type WorkspacePlan = {
  key: "foundation" | "momentum" | "command" | "dominion";
  status: "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  billingCycleAnchor: Date | null;
};
