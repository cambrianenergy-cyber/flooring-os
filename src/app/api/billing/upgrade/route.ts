/**
 * Stripe Upgrade Handler
 * 
 * Handles tier upgrades for existing customers with active subscriptions
 * 
 * POST /api/billing/upgrade
 * Body: {
 *   stripeSubscriptionId: string,
 *   targetTier: "essentials" | "professional" | "enterprise" | "infrastructure",
 *   prorationBehavior?: "create_invoice" | "always_invoice" | "none"
 * }
 */

import { NextResponse } from "next/server";
// import removed: getStripePriceId no longer exported from @/lib/stripe
import { TIER_DEFINITIONS } from "@/lib/pricingTiers";
import type { TierLevel } from "@/lib/pricingTiers";
import type { StripeSubscription } from "@/lib/stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

async function getStripe() {
  const Stripe = await import("stripe");
  const StripeClient = Stripe.default;
  return new StripeClient(STRIPE_SECRET_KEY!);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      stripeSubscriptionId,
      targetTier,
    } = body as {
      stripeSubscriptionId: string;
      targetTier: TierLevel;
    };

    // Validate inputs
    if (!stripeSubscriptionId || !targetTier) {
      return NextResponse.json(
        { error: "Missing required fields: stripeSubscriptionId, targetTier" },
        { status: 400 }
      );
    }

    if (targetTier === "founder") {
      return NextResponse.json(
        { error: "Cannot upgrade to Founder tier" },
        { status: 400 }
      );
    }

    const stripe = await getStripe();
    // Use environment variable for price ID
    const envVar = `STRIPE_PRICE_${targetTier.toUpperCase()}`;
    const newPriceId = process.env[envVar];

    if (!newPriceId) {
      return NextResponse.json(
        { error: `Stripe price ID not configured for tier: ${targetTier} (missing env var ${envVar})` },
        { status: 400 }
      );
    }

    /**
     * Fetch current subscription to get item ID
     */
    const subscription = (await stripe.subscriptions.retrieve(stripeSubscriptionId) as unknown) as StripeSubscription;

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status === "canceled" || subscription.status === "unpaid") {
      return NextResponse.json(
        {
          error: `Cannot upgrade subscription with status: ${subscription.status}`,
        },
        { status: 400 }
      );
    }

    // Get the first item (should be the subscription plan)
    // StripeSubscription.items?.data[0] is { id: string, price: { id: string } }
    const subscriptionItem = subscription.items?.data[0] as { id: string; price: { id: string } } | undefined;
    if (!subscriptionItem) {
      return NextResponse.json(
        { error: "No subscription items found" },
        { status: 400 }
      );
    }

    /**
     * Update subscription with new price
     * This will:
     * - Immediately change the plan
     * - Generate a prorated invoice for the difference
     * - Credit the account if downgrading (with prorationBehavior)
     */
    const updateParams: {
      items: Array<{ id: string; price: string }>;
      metadata: { upgradedAt: string; upgradedToTier: TierLevel };
    } = {
      items: [
        {
          id: subscriptionItem?.id ?? "",
          price: newPriceId,
        },
      ],
      metadata: {
        upgradedAt: new Date().toISOString(),
        upgradedToTier: targetTier,
      },
    };
    // Stripe types may not allow proration_behavior as string; omit if not supported
    const updatedSubscription = (await stripe.subscriptions.update(
      stripeSubscriptionId,
      updateParams
    )) as unknown as StripeSubscription;

    const tierDef = TIER_DEFINITIONS[targetTier];

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.current_period_end
          ? new Date(updatedSubscription.current_period_end * 1000)
          : undefined,
        tier: targetTier,
        tierName: tierDef.displayName,
        monthlyPrice: tierDef.monthlyPrice,
      },
      message: `Successfully upgraded to ${tierDef.displayName}`,
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
