import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/billing";
import { setWorkspaceEntitlements } from "@/lib/billing/setWorkspaceEntitlements";

// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";
// import removed: planFromSubscription not exported from @/lib/stripeConfig

// Extracted handler for testability
export async function handleStripeWebhook(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Webhook secret not set", { status: 500 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });
  const rawBody = Buffer.from(await req.arrayBuffer());
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Example: handle subscription update events
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    // You must map Stripe subscription to your workspaceId and planId
    const workspaceId = subscription.metadata?.workspaceId;
    // Use price.product or price.id for mapping to PlanId if nickname is not set
    let planId = (subscription.items.data[0]?.price.nickname || subscription.items.data[0]?.price.id || "free") as import("@/lib/billing/planMap").PlanId;
    // Fallback to "free" if planId is not valid
    const validPlanIds = ["free", "starter", "pro", "enterprise", "founder"];
    if (!validPlanIds.includes(planId)) planId = "free";
    const status = (subscription.status as "active" | "trialing" | "past_due" | "canceled" | "incomplete") || "incomplete";
    const stripeSubscriptionId = subscription.id;
    const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : undefined;
    // Type-safe extraction of current_period_end
    let currentPeriodEnd: number | undefined = undefined;
    if (
      typeof (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end === "number"
    ) {
      currentPeriodEnd = ((subscription as Stripe.Subscription & { current_period_end: number }).current_period_end) * 1000;
    }

    if (workspaceId && planId && status) {
      await setWorkspaceEntitlements({
        workspaceId,
        planId,
        status,
        stripeSubscriptionId,
        stripeCustomerId,
        currentPeriodEnd,
      });
    }
  }

  // ...rest of your logic unchanged
  return NextResponse.json({ received: true });
}
