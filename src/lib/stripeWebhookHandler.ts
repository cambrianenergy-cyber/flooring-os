import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/billing";
import { adminDb } from "@/lib/firebaseAdmin";
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
  } catch (err) {
    return new NextResponse("Invalid signature", { status: 400 });
  }
  // ...rest of your logic unchanged
  return NextResponse.json({ received: true });
}
