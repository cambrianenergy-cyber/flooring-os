export type PlanKey = "start" | "scale" | "pro" | "elite";
export type AiTier = "assist" | "copilot" | "operator" | "orchestrator";
export type PlanFeatures = {
  docusign: boolean;
  payments: boolean;
  pricingEngine: boolean;
  multiLocation: boolean;
  apiAccess: boolean;
  cashAcceleration?: boolean; // New add-on feature
  estimateIntelligence?: boolean; // Advanced estimate intelligence feature
};
export type Plan = {
  key: PlanKey;
  name: string;
  priceMonthly: number;
  priceId: string;
  maxUsers: number | "unlimited";
  aiTier: AiTier;
  monthlyAiCredits: number;
  workflow: {
    enabled: boolean;
    maxRunsPerMonth: number | "unlimited";
    allowAutonomous: boolean;
  };
  features: PlanFeatures;
};
export const PLANS: Record<PlanKey, Plan> = {
  start: {
    key: "start",
    name: "Square Start",
    priceMonthly: 499,
    priceId: "price_start_499",
    maxUsers: 4,
    aiTier: "assist",
    monthlyAiCredits: 150,
    workflow: { enabled: false, maxRunsPerMonth: 0, allowAutonomous: false },
    features: {
      docusign: false,
      payments: false,
      pricingEngine: false,
      multiLocation: false,
      apiAccess: false,
      cashAcceleration: false,
      estimateIntelligence: false,
    },
  },
  scale: {
    key: "scale",
    name: "Square Scale",
    priceMonthly: 799,
    priceId: "price_scale_799",
    maxUsers: 10,
    aiTier: "copilot",
    monthlyAiCredits: 400,
    workflow: { enabled: true, maxRunsPerMonth: 200, allowAutonomous: false },
    features: {
      docusign: true,
      payments: true,
      pricingEngine: false,
      multiLocation: false,
      apiAccess: false,
      cashAcceleration: true,
      estimateIntelligence: false
    },
  },
  pro: {
    key: "pro",
    name: "Square Pro",
    priceMonthly: 999,
    priceId: "price_pro_999",
    maxUsers: 15,
    aiTier: "operator",
    monthlyAiCredits: 800,
    workflow: { enabled: true, maxRunsPerMonth: "unlimited", allowAutonomous: true },
    features: {
      docusign: true,
      payments: true,
      pricingEngine: true,
      multiLocation: true,
      apiAccess: false,
      cashAcceleration: true,
      estimateIntelligence: true
    },
  },
  elite: {
    key: "elite",
    name: "Square Elite",
    priceMonthly: 1499,
    priceId: "price_elite_1499",
    maxUsers: 30,
    aiTier: "orchestrator",
    monthlyAiCredits: 2000,
    workflow: { enabled: true, maxRunsPerMonth: "unlimited", allowAutonomous: true },
    features: {
      docusign: true,
      payments: true,
      pricingEngine: true,
      multiLocation: true,
      apiAccess: true,
      cashAcceleration: true,
      estimateIntelligence: true
    },
  },
};
export function resolvePlan(planKey?: string): Plan {
  const key = (planKey || "start") as PlanKey;
  return PLANS[key] || PLANS.start;
}
export function hasFeature(planKey: PlanKey, feature: keyof PlanFeatures): boolean {
  return Boolean(PLANS[planKey].features[feature]);
}

