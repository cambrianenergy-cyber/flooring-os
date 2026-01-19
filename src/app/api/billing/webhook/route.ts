import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing";
import { adminDb } from "@/lib/firebaseAdmin";

// Stripe sends raw body, so you may need to adjust Next.js config for this route
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  // Handle subscription events
  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as import("stripe").Stripe.Subscription;
    const customerId = sub.customer;
    const db = adminDb();
    // Find workspace by customerId
    const wsSnap = await db.collection("workspaces").where("stripeCustomerId", "==", customerId).get();
    if (!wsSnap.empty) {
      const wsRef = wsSnap.docs[0].ref;
      // Check for add-ons in subscription items
      const cashAccelPriceIds = [
        process.env.STRIPE_PRICE_CASH_ACCEL_99,
        process.env.STRIPE_PRICE_CASH_ACCEL_199,
      ];
      const compliancePriceIds = [
        process.env.STRIPE_PRICE_COMPLIANCE_AUTOMATION_149,
        process.env.STRIPE_PRICE_COMPLIANCE_AUTOMATION_299,
      ];
      const whiteLabelPriceIds = [
        process.env.STRIPE_PRICE_WHITE_LABEL_99,
        process.env.STRIPE_PRICE_WHITE_LABEL_199,
      ];
      const multiLocationPriceIds = [
        process.env.STRIPE_PRICE_MULTI_LOCATION_299,
        process.env.STRIPE_PRICE_MULTI_LOCATION_599,
      ];
      const customDomainPriceIds = [
        process.env.STRIPE_PRICE_CUSTOM_DOMAIN_299,
      ];
      const zeroLeadLeakPackPriceIds = [
        process.env.STRIPE_PRICE_ZERO_LEAD_LEAK_PACK_149,
      ];
      const instantLeadResponsePackPriceIds = [
        process.env.STRIPE_PRICE_INSTANT_LEAD_RESPONSE_PACK_149,
      ];
      const followUpCadencePackPriceIds = [
        process.env.STRIPE_PRICE_FOLLOW_UP_CADENCE_PACK_149,
      ];
      const deadLeadRecoveryPackPriceIds = [
        process.env.STRIPE_PRICE_DEAD_LEAD_RECOVERY_PACK_149,
      ];
      const trainingPlaybooksPriceIds = [
        process.env.STRIPE_PRICE_TRAINING_PLAYBOOKS_49,
        process.env.STRIPE_PRICE_TRAINING_PLAYBOOKS_99,
      ];
      const apiAccessPriceIds = [
        process.env.STRIPE_PRICE_API_ACCESS_499,
      ];
      const addOns: string[] = [];
      if (sub.items.data.some((item) => cashAccelPriceIds.includes(item.price.id))) {
        addOns.push("cash-acceleration-addon");
      }
      if (sub.items.data.some((item) => zeroLeadLeakPackPriceIds.includes(item.price.id))) {
        addOns.push("zero-lead-leak-pack");
      }
      if (sub.items.data.some((item) => instantLeadResponsePackPriceIds.includes(item.price.id))) {
        addOns.push("instant-lead-response-pack");
      }
      if (sub.items.data.some((item) => followUpCadencePackPriceIds.includes(item.price.id))) {
        addOns.push("follow-up-cadence-pack");
      }
      if (sub.items.data.some((item) => deadLeadRecoveryPackPriceIds.includes(item.price.id))) {
        addOns.push("dead-lead-recovery-pack");
      }
      if (sub.items.data.some((item) => compliancePriceIds.includes(item.price.id))) {
        addOns.push("compliance-automation-addon");
      }
      if (sub.items.data.some((item) => whiteLabelPriceIds.includes(item.price.id))) {
        addOns.push("white-label-branding-addon");
      }
      if (sub.items.data.some((item) => customDomainPriceIds.includes(item.price.id))) {
        addOns.push("custom-domain-addon");
      }
      const workflowAutomationPriceIds = [
        process.env.STRIPE_PRICE_WORKFLOW_AUTOMATION_199,
      ];
      if (sub.items.data.some((item) => workflowAutomationPriceIds.includes(item.price.id))) {
        addOns.push("workflow-automation-addon");
      }
      if (sub.items.data.some((item) => multiLocationPriceIds.includes(item.price.id))) {
        addOns.push("multi-location-intelligence-addon");
      }
      if (sub.items.data.some((item) => trainingPlaybooksPriceIds.includes(item.price.id))) {
        addOns.push("training-playbooks-addon");
      }
      if (sub.items.data.some((item) => apiAccessPriceIds.includes(item.price.id))) {
        addOns.push("api-access-addon");
      }
      // Use planKey from Stripe price metadata or lookup_key
      const mainPrice = sub.items.data[0]?.price;
      const planKey = mainPrice ? (mainPrice.metadata?.plan_key || mainPrice.lookup_key || mainPrice.id) : undefined;
      await wsRef.update({
        "plan.key": planKey,
        "plan.status": sub.status,
        "plan.currentPeriodEnd":
          typeof (sub as unknown as { currentPeriodEnd?: number }).currentPeriodEnd === "number"
            ? (sub as unknown as { currentPeriodEnd: number }).currentPeriodEnd * 1000
            : null,
        "plan.stripeSubscriptionId": sub.id,
        ...(addOns.length > 0 ? { "plan.activeAddOns": addOns } : {}),
      });
    }
  }

  return new NextResponse("ok");
}
