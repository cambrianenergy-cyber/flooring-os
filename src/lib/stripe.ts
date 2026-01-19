// Export getStripePriceId for tier mapping
// Deprecated: getStripePriceId is no longer needed; use Stripe API lookup by planKey/lookup_key

// StripeSubscription type for compatibility
export type StripeSubscription = Stripe.Subscription & {
  current_period_end?: number;
  items?: {
    data: Array<{ id: string; price: { id: string } }>;
  };
};

import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-12-15.clover" });

// Export Stripe environment variables for use in webhook/event logic
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
export const stripeAiMeterEventName = process.env.STRIPE_AI_METER_EVENT_NAME!;

/**
 * Extracts planKey from a Stripe price object using metadata.plan_key or lookup_key.
 * Falls back to undefined if not found.
 */
export function getPlanKeyFromStripePrice(price: Stripe.Price): string | undefined {
  if (price.metadata && price.metadata.plan_key) return price.metadata.plan_key;
  if (price.lookup_key) return price.lookup_key;
  return undefined;
}
