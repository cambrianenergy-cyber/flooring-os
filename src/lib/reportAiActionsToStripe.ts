import { stripe } from "./stripe";

/**
 * Report usage to Stripe Billing Meters.
 * Call this when you finalize an AI action in your system (after it succeeds),
 * not when it starts.
 */
export async function reportAiActionsToStripe(params: {
  stripeCustomerId: string;
  workspaceId: string;
  actionUnits: number;          // e.g. 1, 3, 5 based on agent cost map
  idempotencyKey: string;       // ensure exactly-once
  timestamp?: number;           // unix seconds (optional)
}) {
  const eventName = "ai_actions"; // must match your meter's event_name

  // Stripe Billing Meter Events endpoint
  // (processed async; invoices will reflect aggregated usage)
  const meterEvent = await stripe.billing.meterEvents.create(
    {
      event_name: eventName,
      payload: {
        stripe_customer_id: params.stripeCustomerId,
        value: params.actionUnits,
      },
      // Stripe allows optional timestamp in many meter event flows; keep if you need backfill
      timestamp: params.timestamp,
    } as any,
    {
      idempotencyKey: params.idempotencyKey,
    }
  );

  return meterEvent;
}
