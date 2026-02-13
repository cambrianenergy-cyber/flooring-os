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
  const uid = await getUid(req);
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
