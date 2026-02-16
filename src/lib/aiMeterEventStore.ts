// Server-only code removed for static export
// import { adminDb } from "./firebaseAdmin";
const adminDb = (..._args: any[]) => ({
  collection: (..._args: any[]) => ({
    doc: (..._args: any[]) => ({
      set: async (..._args: any[]) => {},
      get: async (..._args: any[]) => ({ exists: false, data: () => ({ status: "pending" }) }),
      collection: (..._args: any[]) => ({
        doc: (..._args: any[]) => ({
          set: async (..._args: any[]) => {},
          get: async (..._args: any[]) => ({ exists: false, data: () => ({ status: "pending" }) })
        })
      })
    })
  })
});

/**
 * Create a pending AI event record for idempotency and double-billing protection.
 * @param workspaceId Workspace Firestore ID
 * @param aiEventId Unique event ID (e.g., UUID or nanoid)
 * @param eventData Any additional event data (agent, units, etc)
 */
export async function createPendingAiEvent(workspaceId: string, aiEventId: string, eventData: Record<string, unknown>) {
  const db = adminDb();
  await db.collection("workspaces").doc(workspaceId)
    .collection("meter_events").doc(aiEventId)
    .set({
      ...eventData,
      status: "pending",
      createdAt: new Date(),
    });
}

/**
 * Mark an AI event as posted after successful Stripe meter event.
 * @param workspaceId Workspace Firestore ID
 * @param aiEventId Event ID
 * @param stripeMeterEventId Stripe event ID (optional)
 */
export async function markAiEventPosted(workspaceId: string, aiEventId: string, stripeMeterEventId?: string) {
  const db = adminDb();
  await db.collection("workspaces").doc(workspaceId)
    .collection("meter_events").doc(aiEventId)
    .set({
      status: "posted",
      postedAt: new Date(),
      ...(stripeMeterEventId ? { stripeMeterEventId } : {}),
    }, { merge: true });
}

/**
 * Check if an AI event has already been posted (idempotency check).
 * @param workspaceId Workspace Firestore ID
 * @param aiEventId Event ID
 */
export async function isAiEventPosted(workspaceId: string, aiEventId: string): Promise<boolean> {
  const db = adminDb();
  const doc = await db.collection("workspaces").doc(workspaceId)
    .collection("meter_events").doc(aiEventId).get();
  return doc.exists && doc.data()?.status === "posted";
}
