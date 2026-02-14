// API route to handle AI credit overage purchases
// POST /api/billing/ai-overages
import { NextResponse } from "next/server";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });

// Map of overage pack sizes to Stripe price IDs (set these in your env or config)
const OVERAGE_PRICES: Record<string, string> = {
  "1000": process.env.STRIPE_PRICE_AI_OVERAGE_1000!,
  "5000": process.env.STRIPE_PRICE_AI_OVERAGE_5000!,
};

export async function POST(req: Request) {
  try {
    const { workspaceId, packSize } = await req.json();
    if (!workspaceId || !packSize || !OVERAGE_PRICES[packSize]) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Optionally: check if user is allowed to buy overages, etc.

    // Create Stripe Checkout session for the overage pack
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: OVERAGE_PRICES[packSize],
          quantity: 1,
        },
      ],
      metadata: { workspaceId, packSize },
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("AI overage checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
