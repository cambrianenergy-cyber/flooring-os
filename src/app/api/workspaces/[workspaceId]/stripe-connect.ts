import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing";
import { adminDb } from "@/lib/firebaseAdmin";

// POST: Create Stripe Connect account link for onboarding
export async function POST(req: Request, { params }: { params: { workspaceId: string } }) {
  const { workspaceId } = params;
  if (!workspaceId) return new NextResponse("Missing workspaceId", { status: 400 });

  // Find or create Stripe Connect account for this workspace
  const wsRef = adminDb().collection("workspaces").doc(workspaceId);
  const wsSnap = await wsRef.get();
  if (!wsSnap || !wsSnap.exists) return new NextResponse("Workspace not found", { status: 404 });
  const wsData = wsSnap.data();
  if (!wsData) return new NextResponse("Workspace data not found", { status: 404 });
  let stripeAccountId = wsData.stripeAccountId;
  if (!stripeAccountId) {
    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { workspaceId },
    });
    stripeAccountId = account.id;
    await wsRef.set({ stripeAccountId }, { merge: true });
  }

  // Create an account onboarding link
  const origin = req.headers.get("origin") || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/onboarding/stripe-connect?refresh=1`,
    return_url: `${origin}/onboarding/stripe-connect?success=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

// GET: Fetch Stripe Connect account status
export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  const { workspaceId } = params;
  if (!workspaceId) return new NextResponse("Missing workspaceId", { status: 400 });
  const wsRef2 = adminDb().collection("workspaces").doc(workspaceId);
  const wsSnap2 = await wsRef2.get();
  if (!wsSnap2 || !wsSnap2.exists) return new NextResponse("Workspace not found", { status: 404 });
  const wsData2 = wsSnap2.data();
  if (!wsData2) return new NextResponse("Workspace data not found", { status: 404 });
  const stripeAccountId = wsData2.stripeAccountId;
  if (!stripeAccountId) return NextResponse.json({ status: "not_connected" });
  const account = await stripe.accounts.retrieve(stripeAccountId);
  return NextResponse.json({
    status: account.charges_enabled && account.payouts_enabled ? "active" : "pending",
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    accountId: stripeAccountId,
    email: account.email,
    business_type: account.business_type,
    individual: account.individual,
    company: account.company,
  });
}
