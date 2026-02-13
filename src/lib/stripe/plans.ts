export type PlanKey = "starter" | "pro" | "enterprise";

export interface PlanDetails {
  key: PlanKey;
  name: string;
  description: string;
  priceId: string;
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDetails> = {
  starter: {
    key: "starter",
    name: "Starter",
    description: "For small teams getting started.",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ||
      process.env.STRIPE_PRICE_STARTER ||
      "",
    features: ["Up to 3 users", "Basic estimates", "Job tracking"],
  },
  pro: {
    key: "pro",
    name: "Pro",
    description: "For growing teams and advanced features.",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ||
      process.env.STRIPE_PRICE_PRO ||
      "",
    features: ["Up to 15 users", "Advanced analytics", "Priority support"],
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    description: "For large organizations with custom needs.",
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ||
      process.env.STRIPE_PRICE_ENTERPRISE ||
      "",
    features: ["Unlimited users", "Custom integrations", "Dedicated support"],
  },
};
