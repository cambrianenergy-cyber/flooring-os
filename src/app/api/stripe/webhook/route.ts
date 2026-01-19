import fs from "fs";
import path from "path";
// To use your Stripe webhook locally:
// 1. Run `stripe listen --forward-to localhost:3003/api/stripe/webhook`
// 2. Copy the webhook signing secret from the Stripe CLI output
// 3. Add it to your .env.local file as:
//    STRIPE_WEBHOOK_SECRET=whsec_...
// This ensures your endpoint verifies Stripe events securely during development.
export const runtime = "nodejs";
// Type for Stripe subscription with snake_case properties
type StripeSubscriptionSnakeCase = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  billing_cycle_anchor?: number;
};
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/billing";
import { adminDb } from "@/lib/firebaseAdmin";
// import removed: planFromSubscription not exported from @/lib/stripeConfig
// import removed: handleStripeWebhook is unused

export async function POST(req: Request) {
    // Helper to log to file
    const logToFile = (msg: string) => {
      const logPath = path.join(process.cwd(), "logs", "stripe.log");
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    };
  // Security: Ensure webhook secret is set
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set!");
    return new NextResponse("Webhook secret not set", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });
  const rawBody = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Idempotency: check if event already processed
  const db = adminDb();
  const eventRef = db.collection("stripeEvents").doc(event.id);
  const eventDoc = await eventRef.get();
  if (eventDoc.exists) {
    const msg = `Duplicate event received: ${event.id} (${event.type})`;
    console.log(msg);
    logToFile(msg);
    return NextResponse.json({ received: true, duplicate: true });
  }
  await eventRef.set({ processedAt: new Date(), type: event.type });

  // Logging
  const msg = `Stripe event received: ${event.id} (${event.type})`;
  console.log(msg);
  logToFile(msg);

  const handleSub = async (sub: Stripe.Subscription) => {
    const customerId = String(sub.customer);
    try {
      // Always resolve workspaceId from customer metadata (most reliable)
      const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
      const workspaceId = customer.metadata?.workspaceId || sub.metadata?.workspaceId;

      if (!workspaceId) {
        const warnMsg = `No workspaceId found for customer ${customerId}, subscription ${sub.id}`;
        console.warn(warnMsg);
        logToFile(warnMsg);
        return;
      }

      // Extract planKey from Stripe price metadata or lookup_key
      const mainPrice = sub.items?.data[0]?.price;
      const planKey = mainPrice ? (mainPrice.metadata?.plan_key || mainPrice.lookup_key || mainPrice.id) : undefined;
      const s = sub as StripeSubscriptionSnakeCase;
      await db.collection("workspaces").doc(workspaceId).set(
        {
          planKey,
          billingStatus: sub.status,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          currentPeriodStart: s.current_period_start ? new Date(s.current_period_start * 1000) : null,
          currentPeriodEnd: s.current_period_end ? new Date(s.current_period_end * 1000) : null,
          cancelAtPeriodEnd: !!s.cancel_at_period_end,
          billingCycleAnchor: s.billing_cycle_anchor ? new Date(s.billing_cycle_anchor * 1000) : null,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      // Instantly sync AI policy with plan changes
      if (planKey) {
        const { updateAIPolicyForPlan } = await import("@/lib/aiPolicy");
        await updateAIPolicyForPlan(workspaceId, planKey);
      }
    } catch (err) {
      console.error(`Error handling subscription for customer ${customerId}:`, err);
    }
  };

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSub(sub);
        break;
      }

      // Optional: payment failures (keeps UI accurate)
      case "invoice.payment_failed":
      case "invoice.payment_succeeded": {
        // Usually a subscription.updated also fires, but you can log/audit here.
        const invoiceMsg = `Invoice event: ${event.type} for invoice ${event.data.object['id']}`;
        console.log(invoiceMsg);
        logToFile(invoiceMsg);
        break;
      }

      default:
        const unhandledMsg = `Unhandled event type: ${event.type}`;
        console.log(unhandledMsg);
        logToFile(unhandledMsg);
    }
  } catch (err) {
    console.error(`Error processing event ${event.id}:`, err);
    // Still return 200 to avoid Stripe retries unless you want them
  }

  return NextResponse.json({ received: true });
}
