// Alias for compatibility with portal route
export { getOrCreateStripeCustomer as getOrCreateCustomerForWorkspace };
// src/lib/billing.ts
// Server-only code removed for static export
// import { adminDb } from "./firebaseAdmin";
const adminDb = (..._args: any[]) => ({
  collection: (..._args: any[]) => ({
    doc: (..._args: any[]) => ({
      get: async (..._args: any[]) => ({ exists: false, data: () => ({ plan: { stripeCustomerId: undefined } }) }),
      set: async (..._args: any[]) => {}
    })
  })
});
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });

export async function getOrCreateStripeCustomer(workspaceId: string, email?: string, userId?: string) {
  const db = adminDb();
  const wsRef = db.collection("workspaces").doc(workspaceId);
  const wsSnap = await wsRef.get();
  if (!wsSnap.exists) throw new Error("WORKSPACE_NOT_FOUND");

  const existingCustomerId = wsSnap.data()!.plan?.stripeCustomerId as string | undefined;
  if (existingCustomerId) {
    // Self-heal metadata to guarantee webhook mapping
    await stripe.customers.update(existingCustomerId, { metadata: { workspaceId, ...(userId ? { userId } : {}) } });
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { workspaceId, ...(userId ? { userId } : {}) },
  });

  await wsRef.set(
    { plan: { stripeCustomerId: customer.id }, updatedAt: new Date() },
    { merge: true }
  );

  return customer.id;
}
