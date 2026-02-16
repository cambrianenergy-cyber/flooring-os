import type { PlanId } from "@/lib/billing/planMap";

// Put your REAL Stripe price IDs here (from Stripe dashboard)
export const STRIPE_PRICE_TO_PLAN: Record<string, PlanId> = {
  // "price_123": "starter",
  // "price_456": "pro",
  // "price_789": "enterprise",
};

export function planFromStripePriceId(priceId?: string | null): PlanId | null {
  if (!priceId) return null;
  return STRIPE_PRICE_TO_PLAN[priceId] ?? null;
}
