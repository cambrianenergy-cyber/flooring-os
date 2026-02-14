import { writeBillingAuditLog } from "@/lib/audit/billing";
import { adminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig)
    return NextResponse.json(
      { ok: false, error: "Missing signature" },
      { status: 400 },
    );

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: `Webhook error: ${errorMsg}` },
      { status: 400 },
    );
  }

  // You must set workspaceId as metadata on checkout session/subscription
  const obj = event.data.object as unknown as { [key: string]: any };
  const workspaceId =
    (obj && typeof obj === "object" && obj.metadata?.workspaceId) ||
    (obj &&
      typeof obj === "object" &&
      obj.subscription_details?.metadata?.workspaceId) ||
    (obj &&
      typeof obj === "object" &&
      obj.lines?.data?.[0]?.metadata?.workspaceId);

  if (!workspaceId) {
    // Don’t fail the webhook; log it
    return NextResponse.json({
      ok: true,
      note: "No workspaceId metadata found",
    });
  }

  const billingRef = adminDb.collection("billing").doc(workspaceId);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const planId =
        typeof sub.metadata?.planId === "string" ? sub.metadata.planId : "pro";
      const isActive = ["active", "trialing"].includes(sub.status);
      await billingRef.set(
        {
          workspaceId,
          planId,
          isActive,
          stripeCustomerId:
            typeof sub.customer === "string"
              ? sub.customer
              : (sub.customer as Stripe.Customer)?.id,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: new Date(
            typeof (
              sub as Stripe.Subscription & { current_period_end?: number }
            ).current_period_end === "number"
              ? (sub as Stripe.Subscription & { current_period_end: number })
                  .current_period_end * 1000
              : 0,
          ),
          updatedAt: new Date(),
        },
        { merge: true },
      );
      await writeBillingAuditLog({
        workspaceId,
        action: event.type,
        meta: {
          planId,
          stripeSubscriptionId: sub.id,
          status: sub.status,
        },
      });
      break;
    }
    case "customer.subscription.deleted": {
      await billingRef.set(
        { workspaceId, isActive: false, updatedAt: new Date() },
        { merge: true },
      );
      await writeBillingAuditLog({
        workspaceId,
        action: event.type,
        meta: {},
      });
      break;
    }
    case "invoice.payment_failed": {
      await billingRef.set(
        {
          workspaceId,
          isActive: false,
          updatedAt: new Date(),
          lastPaymentFailedAt: new Date(),
        },
        { merge: true },
      );
      await writeBillingAuditLog({
        workspaceId,
        action: event.type,
        meta: {},
      });
      break;
    }
    case "invoice.payment_succeeded": {
      await billingRef.set(
        {
          workspaceId,
          isActive: true,
          updatedAt: new Date(),
          lastPaymentSucceededAt: new Date(),
        },
        { merge: true },
      );
      await writeBillingAuditLog({
        workspaceId,
        action: event.type,
        meta: {},
      });
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
