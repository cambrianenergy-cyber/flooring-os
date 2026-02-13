import { requireRole, requireWorkspaceMember } from "@/lib/authz";
import { getOrCreateStripeCustomer, stripe } from "@/lib/billing";
import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

import { getAuth } from "firebase-admin/auth";
async function getUid(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new Error("UNAUTHENTICATED");
  const token = authHeader.split("Bearer ")[1];
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function POST(req: Request) {
  try {
    const uid = await getUid(req);
    const { workspaceId, planKey } = await req.json();

    const member = await requireWorkspaceMember(workspaceId, uid);
    requireRole(member.role, ["owner", "admin"]);

    // Find the active Stripe price with matching planKey in metadata or lookup_key
    const prices = await stripe.prices.list({ limit: 100, active: true });
    const price = prices.data.find(
      (p) => p.metadata?.plan_key === planKey || p.lookup_key === planKey,
    );
    if (!price) return new NextResponse("Invalid planKey", { status: 400 });
    const priceId = price.id;

    const db = adminDb();
    const userSnap = await db.collection("users").doc(uid).get();
    const email = userSnap.exists ? userSnap.data()!.email : undefined;

    const customerId = await getOrCreateStripeCustomer(workspaceId, email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
      subscription_data: {
        metadata: { workspaceId }, // extra safety
      },
      metadata: { workspaceId }, // extra safety
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
