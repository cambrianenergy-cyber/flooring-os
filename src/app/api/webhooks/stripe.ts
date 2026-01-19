// Type guards for Stripe objects
function isStripeInvoice(obj: unknown): obj is { subscription?: string; next_payment_attempt?: number; attempt_count?: number } {
  return typeof obj === 'object' && obj !== null &&
    ('subscription' in obj) &&
    (typeof (obj as { subscription?: unknown }).subscription === 'string' || typeof (obj as { subscription?: unknown }).subscription === 'number');
}

function isStripeSubscription(obj: unknown): obj is {
  id?: string;
  status?: string;
  current_period_end?: number;
  cancellation_details?: { reason?: string };
  canceled_at?: number | null;
} {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

function getStripeObject<T = unknown>(event: unknown): T | undefined {
  if (event && typeof event === 'object' && 'data' in event) {
    const data = (event as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'object' in data) {
      return (data as { object?: T }).object;
    }
  }
  return undefined;
}
/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates subscription status in Firestore
 * 
 * Endpoint: POST /api/webhooks/stripe
 * 
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe Dashboard
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  updateSubscriptionStatus,
  markSubscriptionPaid,
  getSubscriptionById,
} from "@/lib/subscriptionManager";
import { grantAiOverageCredits } from "@/lib/metering";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Verify Stripe webhook signature using crypto (no stripe dependency)
 */
function verifyWebhookSignature(
  body: string,
  signature: string
): Record<string, unknown> | null {
  try {
    // Extract timestamp and signatures from header
    const parts = signature.split(",");
    let timestamp = "";
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key?.trim() === "t") timestamp = value;
      if (key?.trim() === "v1") signatures.push(value);
    }

    if (!timestamp) {
      console.error("No timestamp in webhook signature");
      return null;
    }

    // Verify timestamp is recent (within 5 minutes)
    const time = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - time) > 300) {
      console.error("Webhook timestamp too old");
      return null;
    }

    // Compute expected signature
    const signedContent = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(signedContent)
      .digest("hex");

    // Compare signatures
    const isValid = signatures.some(
      (sig) =>
        crypto.timingSafeEqual(
          Buffer.from(sig),
          Buffer.from(expectedSignature)
        ) ||
        sig === expectedSignature // Fallback for string comparison
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return null;
    }

    // Parse and return event
    return JSON.parse(body);
  } catch (error) {
    console.error("Webhook verification error:", error);
    return null;
  }
}

/**
 * Handle invoice.paid event
 * Marks subscription as active and updates next billing date
 */
async function handleInvoicePaid(
  invoice: Record<string, unknown>
): Promise<void> {
  if (!isStripeInvoice(invoice)) {
    console.warn("Invoice is not a valid Stripe invoice object");
    return;
  }
  const subscriptionId = String(invoice.subscription);
  if (!subscriptionId) {
    console.warn("Invoice has no subscription ID");
    return;
  }
  try {
    const nextBillingDate = typeof invoice.next_payment_attempt === 'number'
      ? invoice.next_payment_attempt * 1000 // Convert to ms
      : Date.now() + 30 * 24 * 60 * 60 * 1000; // Fallback to 30 days
    await markSubscriptionPaid(subscriptionId, nextBillingDate);
    console.log(`✅ Subscription marked as paid: ${subscriptionId}`);
  } catch (error) {
    console.error("Error handling invoice.paid:", error);
    throw error;
  }
}

/**
 * Handle invoice.payment_failed event
 * Marks subscription as past_due
 */
async function handleInvoicePaymentFailed(
  invoice: Record<string, unknown>
): Promise<void> {
  if (!isStripeInvoice(invoice)) {
    console.warn("Invoice is not a valid Stripe invoice object");
    return;
  }
  const subscriptionId = String(invoice.subscription);
  if (!subscriptionId) {
    console.warn("Invoice has no subscription ID");
    return;
  }
  try {
    const attemptCount = typeof invoice.attempt_count === 'number' ? invoice.attempt_count : 0;
    await updateSubscriptionStatus(subscriptionId, "past_due", {
      failedPaymentAttempts: attemptCount + 1,
    });
    console.log(`⚠️ Subscription marked as past_due: ${subscriptionId}`);
    // TODO: Send email notification to user about payment failure
  } catch (error) {
    console.error("Error handling invoice.payment_failed:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.updated event
 * Handles tier changes, cancellations, etc.
 */
async function handleSubscriptionUpdated(
  stripeSubscription: Record<string, unknown>
): Promise<void> {
  if (!isStripeSubscription(stripeSubscription)) {
    console.warn("Not a valid Stripe subscription object");
    return;
  }
  const subscriptionId = String(stripeSubscription.id);

  try {
    // Map Stripe status to our status
    let status: "active" | "trialing" | "past_due" | "canceled" = "active";
    const subStatus = stripeSubscription.status;
    if (subStatus === "trialing") {
      status = "trialing";
    } else if (subStatus === "past_due") {
      status = "past_due";
    } else if (subStatus === "canceled") {
      status = "canceled";
    }

    // Get our subscription from Firestore
    const ourSubscription = await getSubscriptionById(subscriptionId);
    if (!ourSubscription) {
      console.warn(`Subscription not found in Firestore: ${subscriptionId}`);
      return;
    }

    // --- Stripe SDK and Firestore imports ---
    const { stripe } = await import("@/lib/stripe");
    const { doc, updateDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    const { getPlanKeyFromStripePrice } = await import("@/lib/stripe");

    // Get Stripe planKey from subscription's price
    let planKey: string | undefined = undefined;
    let seatLimit: number | undefined = undefined;
    const sub = stripeSubscription as import("stripe").Stripe.Subscription;
    if (sub.items && Array.isArray(sub.items.data) && sub.items.data.length > 0) {
      const priceId = sub.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      planKey = getPlanKeyFromStripePrice(price);
      // Optionally, map planKey to seatLimit if you want to enforce it here
      if (planKey) {
        try {
          const { resolvePlan } = await import("@/lib/plans");
          seatLimit = resolvePlan(planKey).maxUsers as number;
        } catch {}
      }
    }

    // Update status and metadata in subscription
    const nextBillingDate = typeof stripeSubscription.current_period_end === 'number'
      ? stripeSubscription.current_period_end * 1000
      : ourSubscription.nextBillingDate;
    const cancelReason = stripeSubscription.cancellation_details && typeof stripeSubscription.cancellation_details === 'object' && 'reason' in stripeSubscription.cancellation_details
      ? stripeSubscription.cancellation_details.reason
      : null;
    const canceledAt = stripeSubscription.canceled_at;
    await updateSubscriptionStatus(subscriptionId, status, {
      nextBillingDate,
      stripeStatus: subStatus,
      cancelReason,
      canceledAt: typeof canceledAt === 'number' ? canceledAt * 1000 : null,
      planKey,
      seatLimit,
      stripeSubscriptionId: subscriptionId,
    });

    // Mirror to workspace document
    if (ourSubscription.workspaceId) {
      const workspaceRef = doc(db, "workspaces", ourSubscription.workspaceId);
      const workspaceUpdate: Record<string, unknown> = {
        planKey,
        billingStatus: status,
        seatLimit: seatLimit ?? ourSubscription.seatLimit,
        stripeSubscriptionId: subscriptionId,
        updatedAt: Date.now(),
      };
      await updateDoc(workspaceRef, workspaceUpdate);
    }

    console.log(
      `✏️ Subscription updated: ${subscriptionId} → ${status}`
    );
  } catch (error) {
    console.error("Error handling subscription.updated:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted event
 * Marks subscription as canceled
 */
async function handleSubscriptionDeleted(
  stripeSubscription: Record<string, unknown>
): Promise<void> {
  if (!isStripeSubscription(stripeSubscription)) {
    console.warn("Not a valid Stripe subscription object");
    return;
  }
  const subscriptionId = String(stripeSubscription.id);

  try {
    const cancelReason = stripeSubscription.cancellation_details && typeof stripeSubscription.cancellation_details === 'object' && 'reason' in stripeSubscription.cancellation_details
      ? stripeSubscription.cancellation_details.reason
      : "unknown";
    await updateSubscriptionStatus(subscriptionId, "canceled", {
      canceledAt: Date.now(),
      cancelReason,
    });

    console.log(`🚫 Subscription canceled: ${subscriptionId}`);

    // TODO: Notify user that subscription has been canceled
  } catch (error) {
    console.error("Error handling subscription.deleted:", error);
    throw error;
  }
}

// Helper: handle successful AI overage payment
async function handleAiOveragePayment(session: Stripe.Checkout.Session) {
  // Stripe Checkout session metadata: workspaceId, packSize
  const metadata = session.metadata as { workspaceId?: string; packSize?: string } | null | undefined;
  const workspaceId = metadata?.workspaceId;
  const packSize = metadata?.packSize;
  if (!workspaceId || !packSize) return;
  // Map packSize to credits (1 credit = 200 tokens, or as defined)
  const credits = parseInt(packSize, 10);
  if (!credits || credits <= 0) return;
  await grantAiOverageCredits(workspaceId, credits);
  console.log(`Granted ${credits} AI overage credits to workspace ${workspaceId}`);
}

/**
 * Main webhook handler
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);

    if (!event) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    console.log(`📨 Stripe event: ${event.type}`);

    // Handle AI overage payment (one-time payment session completed)
    if (event.type === "checkout.session.completed") {
      const session = getStripeObject<Stripe.Checkout.Session>(event);
      if (
        session &&
        session.mode === "payment" &&
        session.metadata &&
        typeof session.metadata === "object" &&
        "packSize" in session.metadata &&
        typeof session.metadata.packSize === "string"
      ) {
        await handleAiOveragePayment(session);
      }
    }

    // Handle different event types
    switch (event.type) {
      case "invoice.paid": {
        const invoice = getStripeObject(event) as Record<string, unknown>;
        if (invoice) await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = getStripeObject(event) as Record<string, unknown>;
        if (invoice) await handleInvoicePaymentFailed(invoice);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = getStripeObject(event) as Record<string, unknown>;
        if (subscription) await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = getStripeObject(event) as Record<string, unknown>;
        if (subscription) await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
