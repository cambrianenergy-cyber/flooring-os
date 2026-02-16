// Local extension for Stripe.Subscription to include current_period_end
type StripeSubscriptionWithPeriodEnd = Stripe.Subscription & { current_period_end?: number };
import Stripe from "stripe";
import { headers } from "next/headers";
import { getFirestore } from "@/lib/firebaseAdmin";
import { setWorkspaceEntitlements } from "@/lib/billing/setWorkspaceEntitlements";
import { planFromStripePriceId } from "@/lib/billing/stripePriceMap";
import type { PlanId } from "@/lib/billing/planMap";

export const runtime = "nodejs"; // IMPORTANT for Stripe signature verification

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

function statusFromStripe(sub: Stripe.Subscription): "active" | "trialing" | "past_due" | "canceled" | "incomplete" {
  if (sub.status === "trialing") return "trialing";
  if (sub.status === "active") return "active";
  if (sub.status === "past_due" || sub.status === "unpaid") return "past_due";
  if (sub.status === "incomplete" || sub.status === "incomplete_expired") return "incomplete";
  if (sub.status === "canceled") return "canceled";
  return "past_due";
}

function getPriceIdFromSubscription(sub: Stripe.Subscription): string | null {
  const item = sub.items.data?.[0];
  const priceId = item?.price?.id ?? null;
  return priceId;
}

async function getWorkspaceIdFromStripeObject(obj: unknown): Promise<string | null> {
  // Type guard for metadata
  const hasMetadata = (o: unknown): o is { metadata?: { workspaceId?: string }, customer?: string } =>
    typeof o === 'object' && o !== null && ('metadata' in o || 'customer' in o);
  if (!hasMetadata(obj)) return null;
  const metaWorkspaceId = obj?.metadata?.workspaceId;
  if (typeof metaWorkspaceId === "string" && metaWorkspaceId.length > 5) return metaWorkspaceId;
  const customerId = obj?.customer;
  if (typeof customerId === "string") {
    const customer = await stripe.customers.retrieve(customerId);
    const ws = (customer as Stripe.Customer)?.metadata?.workspaceId;
    if (typeof ws === "string" && ws.length > 5) return ws;
  }
  return null;
}

async function upsertSubscriptionMirror(params: {
  workspaceId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  planId?: PlanId | null;
  status?: string | null;
  currentPeriodEnd?: number | null;
}) {
  const db = getFirestore();
  const ref = db.collection("workspaces").doc(params.workspaceId).collection("billing").doc("stripe");
  await ref.set(
    {
      stripeCustomerId: params.stripeCustomerId ?? null,
      stripeSubscriptionId: params.stripeSubscriptionId ?? null,
      planId: params.planId ?? null,
      status: params.status ?? null,
      currentPeriodEnd: params.currentPeriodEnd ?? null,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

async function idempotencyGuard(eventId: string): Promise<boolean> {
  const db = getFirestore();
  const ref = db.collection("stripe_events").doc(eventId);
  const snap = await ref.get();
  if (snap.exists) return true;
  await ref.set({ processedAt: Date.now() });
  return false;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "unknown";
    return new Response(`Webhook signature verification failed: ${errorMsg}`, { status: 400 });
  }

  if (await idempotencyGuard(event.id)) {
    return new Response("Already processed", { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = await getWorkspaceIdFromStripeObject(session);
        if (!workspaceId) break;
        const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
        const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        if (stripeSubscriptionId) {
          const subRaw = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          const sub = subRaw as Stripe.Subscription;
          const priceId = getPriceIdFromSubscription(sub);
          const planId = planFromStripePriceId(priceId) ?? "starter";
          const status = statusFromStripe(sub);
          const subWithEnd = sub as StripeSubscriptionWithPeriodEnd;
          const currentPeriodEnd =
            typeof subWithEnd.current_period_end === 'number'
              ? subWithEnd.current_period_end * 1000
              : null;
          await upsertSubscriptionMirror({ workspaceId, stripeCustomerId, stripeSubscriptionId, planId, status, currentPeriodEnd });
          await setWorkspaceEntitlements({
            workspaceId,
            planId,
            status,
            stripeCustomerId: stripeCustomerId ?? undefined,
            stripeSubscriptionId,
            currentPeriodEnd: currentPeriodEnd ?? undefined,
            isFounder: false,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = await getWorkspaceIdFromStripeObject(sub);
        if (!workspaceId) break;
        const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : null;
        const stripeSubscriptionId = sub.id;
        const priceId = getPriceIdFromSubscription(sub);
        const planId = planFromStripePriceId(priceId) ?? "starter";
        const status = statusFromStripe(sub);
        const subWithEnd = sub as StripeSubscriptionWithPeriodEnd;
        const currentPeriodEnd =
          typeof subWithEnd.current_period_end === 'number'
            ? subWithEnd.current_period_end * 1000
            : null;
        await upsertSubscriptionMirror({ workspaceId, stripeCustomerId, stripeSubscriptionId, planId, status, currentPeriodEnd });
        await setWorkspaceEntitlements({
          workspaceId,
          planId,
          status,
          stripeCustomerId: stripeCustomerId ?? undefined,
          stripeSubscriptionId,
          currentPeriodEnd: currentPeriodEnd ?? undefined,
          isFounder: false,
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (!stripeCustomerId) break;
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        const workspaceId = (customer as Stripe.Customer)?.metadata?.workspaceId;
        if (!workspaceId) break;
        await upsertSubscriptionMirror({ workspaceId, stripeCustomerId, status: "past_due" });
        const db = getFirestore();
        const entRef = db.collection("workspaces").doc(workspaceId).collection("entitlements").doc("current");
        const entSnap = await entRef.get();
        const entData = entSnap.exists ? entSnap.data() : undefined;
        const currentPlanId = (entData && typeof entData.planId === 'string' ? entData.planId : "starter") as PlanId;
        await setWorkspaceEntitlements({
          workspaceId,
          planId: currentPlanId,
          status: "past_due",
          stripeCustomerId,
          isFounder: false,
        });
        break;
      }
      default:
        break;
    }
    return new Response("ok", { status: 200 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "unknown";
    return new Response(`Webhook handler error: ${errorMsg}`, { status: 500 });
  }
}
