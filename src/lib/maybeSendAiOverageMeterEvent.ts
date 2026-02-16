// Server-only code removed for static export
// import { adminDb } from "./firebaseAdmin";
type AdminDbStub = {
  collection: (name?: string) => {
    doc: () => {
      get: () => Promise<{ exists: boolean; data: () => { stripeCustomerId: string; stripeSubscriptionId: string; aiMeteredPriceId: string; plan: { stripeCustomerId: string; stripeSubscriptionId: string; aiMeteredPriceId: string } } }>
    }
  }
};
const adminDb: () => AdminDbStub = () => ({
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: true,
        data: () => ({
          stripeCustomerId: "stub-customer",
          stripeSubscriptionId: "stub-sub",
          aiMeteredPriceId: "stub-metered",
          plan: {
            stripeCustomerId: "stub-customer-plan",
            stripeSubscriptionId: "stub-sub-plan",
            aiMeteredPriceId: "stub-metered-plan"
          }
        })
      })
    })
  })
});
import { sendStripeMeterEvent } from "./sendStripeMeterEvent";

/**
 * Utility to send a Stripe Meter Event for AI overage actions if overage billing is enabled.
 *
 * @param workspaceId Workspace Firestore ID
 * @param quantity Number of overage actions (usually 1)
 */
export async function maybeSendAiOverageMeterEvent(workspaceId: string, quantity: number = 1) {
  const db = adminDb();
    const wsSnap = await db.collection("workspaces").doc().get();
  if (!wsSnap.exists) return;
  const ws = wsSnap.data();
  if (!ws) return;
  const stripeCustomerId = ws.stripeCustomerId || ws.plan?.stripeCustomerId;
  const stripeSubscriptionId = ws.stripeSubscriptionId || ws.plan?.stripeSubscriptionId;
  const meteredPriceId = ws.aiMeteredPriceId || ws.plan?.aiMeteredPriceId || process.env.AI_METERED_PRICE_ID;

  // Only send if metered price is attached (overage billing enabled)
  if (stripeCustomerId && stripeSubscriptionId && meteredPriceId) {
    await sendStripeMeterEvent({
      customerId: stripeCustomerId,
      subscriptionId: stripeSubscriptionId,
      quantity,
      eventName: "ai_actions",
      subscriptionItemId: meteredPriceId,
    });
  }
}
