import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing";
import { requireWorkspaceMember, requireRole } from "@/lib/authz";
import { adminDb } from "@/lib/firebaseAdmin";

function getUid(req: Request) {
  const uid = req.headers.get("x-debug-uid"); // replace with real auth
  if (!uid) throw new Error("UNAUTHENTICATED");
  return uid;
}

export async function POST(req: Request) {
  const uid = getUid(req);

  // Accept either newPlanKey or newPriceId for backward compatibility
  const { workspaceId, newPlanKey, newPriceId } = await req.json();

  const member = await requireWorkspaceMember(workspaceId, uid);
  requireRole(member.role, ["owner", "admin"]);

  const db = adminDb();
  const ws = await db.collection("workspaces").doc(workspaceId).get();
  if (!ws.exists) return new NextResponse("Workspace not found", { status: 404 });

  const subId = ws.data()!.plan?.stripeSubscriptionId;
  if (!subId) return new NextResponse("No active subscription", { status: 400 });


  // If newPlanKey is provided, resolve the priceId from Stripe API
  let priceId = newPriceId;
  if (newPlanKey && !newPriceId) {
    const prices = await stripe.prices.list({ limit: 100, active: true });
    const price = prices.data.find(
      (p) => p.metadata?.plan_key === newPlanKey || p.lookup_key === newPlanKey
    );
    if (!price) return new NextResponse("Invalid newPlanKey", { status: 400 });
    priceId = price.id;
  }
  if (!priceId) return new NextResponse("No priceId provided or found", { status: 400 });

  const sub = await stripe.subscriptions.retrieve(subId);
  const itemId = sub.items.data[0].id;

  await stripe.subscriptions.update(subId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: "create_prorations", // or "none" if you want clean billing
  });

  return NextResponse.json({ ok: true });
}
