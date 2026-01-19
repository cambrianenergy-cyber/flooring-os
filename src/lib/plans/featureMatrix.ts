import { PLANS, type PlanFeatures, type PlanKey } from "@/lib/plans";

export type FeatureKey = keyof PlanFeatures;

export const featureMatrix: Record<PlanKey, PlanFeatures> = {
  start: PLANS.start.features,
  scale: PLANS.scale.features,
  pro: PLANS.pro.features,
  elite: PLANS.elite.features,
};

export function getFeatures(planKey: PlanKey): PlanFeatures {
  return featureMatrix[planKey];
}
