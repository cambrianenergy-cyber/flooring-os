import { NextResponse } from "next/server";
import { getOrCreateStripeCustomer, stripe } from "@/lib/billing";
import { requireWorkspaceMember, requireRole } from "@/lib/authz";

function getUid(req: Request) {
  const uid = req.headers.get("x-debug-uid"); // replace with real Firebase auth verification
  if (!uid) throw new Error("UNAUTHENTICATED");
  return uid;
}

/**
 * POST /api/billing/cash-acceleration
 * Body: { workspaceId: string, price: "99" | "199" }
 * Returns: { url: string }
 */
export async function POST(req: Request) {
  try {
    const uid = getUid(req);
    const { workspaceId, price } = await req.json();

    const member = await requireWorkspaceMember(workspaceId, uid);
    requireRole(member.role, ["owner", "admin"]);

    // Select price ID based on requested price
    const priceId =
      price === "99"
        ? process.env.STRIPE_PRICE_CASH_ACCEL_99
        : price === "199"
        ? process.env.STRIPE_PRICE_CASH_ACCEL_199
        : null;

    if (!priceId) return new NextResponse("Invalid price option", { status: 400 });

    // Get or create Stripe customer
    const db = (await import("@/lib/firebaseAdmin")).adminDb();
    const userSnap = await db.collection("users").doc(uid).get();
    const email = userSnap.exists ? userSnap.data()!.email : undefined;
    const customerId = await getOrCreateStripeCustomer(workspaceId, email);

    // Create Stripe Checkout session for add-on
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
      subscription_data: {
        metadata: { workspaceId, addOn: "cash-acceleration-addon" },
      },
      metadata: { workspaceId, addOn: "cash-acceleration-addon" },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Cash Acceleration Checkout error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
