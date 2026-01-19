import { NextResponse } from "next/server";
import { getOrCreateStripeCustomer, stripe } from "@/lib/billing";
import { requireWorkspaceMember, requireRole } from "@/lib/authz";
import { adminDb } from "@/lib/firebaseAdmin";

function getUid(req: Request) {
  const uid = req.headers.get("x-debug-uid"); // replace with real auth
  if (!uid) throw new Error("UNAUTHENTICATED");
  return uid;
}

export async function POST(req: Request) {
  const uid = getUid(req);
  const { workspaceId } = await req.json();

  const member = await requireWorkspaceMember(workspaceId, uid);
  requireRole(member.role, ["owner", "admin"]);

  const db = adminDb();
  const userSnap = await db.collection("users").doc(uid).get();
  const email = userSnap.exists ? userSnap.data()!.email : undefined;

  const customerId = await getOrCreateStripeCustomer(workspaceId, email);

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: process.env.STRIPE_PORTAL_RETURN_URL!,
  });

  return NextResponse.json({ url: portal.url });
}
