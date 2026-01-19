import { stripe } from "./stripe";

/**
 * Sends a Stripe Meter Event for AI overage actions.
 * @param customerId Stripe customer ID
 * @param subscriptionId Stripe subscription ID
 * @param quantity Number of overage actions (usually 1)
 * @param eventName Stripe Meter Event name (e.g., "ai_actions")
 */
export async function sendStripeMeterEvent({
  customerId,
  subscriptionId,
  quantity,
  eventName = "ai_actions",
  subscriptionItemId,
}: {
  customerId: string;
  subscriptionId: string;
  quantity: number;
  eventName?: string;
  subscriptionItemId: string;
}) {
  // Stripe Billing Meter Events API for metered billing
  // https://stripe.com/docs/billing/metered-billing/meter-events
  await stripe.billing.meterEvents.create(
    {
      event_name: eventName,
      payload: {
        stripe_customer_id: customerId,
        value: quantity,
      },
      timestamp: Math.floor(Date.now() / 1000),
    } as any
  );
}
