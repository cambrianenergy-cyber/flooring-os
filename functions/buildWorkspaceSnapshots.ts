import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();

// (countQuery removed as it was unused)

// Types for workspace and billing
type Workspace = {
  id: string;
  name?: string;
  industry?: string;
  founderId?: string;
  createdAt?: FirebaseFirestore.Timestamp;
};

type Billing = {
  planId?: string;
  status?: string;
  mrrCents?: number;
  totalRevenueCents?: number;
};

// Helper: get all workspaces
async function getAllWorkspaces(): Promise<Workspace[]> {
  const snap = await db.collection("workspaces").get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Workspace);
}

// Helper: get founderId for workspace (assume field on workspace)
function getFounderId(workspace: Workspace): string {
  return workspace.founderId || "defaultFounderId";
}

export const buildWorkspaceSnapshots = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async () => {
    const workspaces = await getAllWorkspaces();
    const now = admin.firestore.Timestamp.now();
    const since30d = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );

    for (const ws of workspaces) {
      const workspaceId = ws.id;
      const founderId = getFounderId(ws);
      // Billing
      const billingSnap = await db
        .doc(`workspaces/${workspaceId}/billing/default`)
        .get();
      const billing: Billing = billingSnap.exists
        ? (billingSnap.data() as Billing)
        : {};
      // Members
      const membersSnap = await db
        .collection(`workspaces/${workspaceId}/members`)
        .where("active", "==", true)
        .get();
      const activeUsers = membersSnap.size;
      // Estimates
      const estimatesSnap = await db
        .collection(`workspaces/${workspaceId}/estimates`)
        .where("createdAt", ">=", since30d)
        .get();
      const estimates30d = estimatesSnap.size;
      // Contracts
      const contractsSnap = await db
        .collection(`workspaces/${workspaceId}/contracts`)
        .where("createdAt", ">=", since30d)
        .get();
      const contracts30d = contractsSnap.size;
      // Wins (signed contracts)
      const winsSnap = await db
        .collection(`workspaces/${workspaceId}/contracts`)
        .where("signedAt", ">=", since30d)
        .get();
      const wins30d = winsSnap.size;
      // System issues
      const systemIssuesSnap = await db
        .collection(`founder/${founderId}/systemIssues`)
        .where("workspaceId", "==", workspaceId)
        .where("createdAt", ">=", since30d)
        .get();
      const systemIssuesCount = systemIssuesSnap.size;
      // Docusign stuck
      const docusignSnap = await db
        .collection(`founder/${founderId}/docusignQueue`)
        .where("workspaceId", "==", workspaceId)
        .where("createdAt", ">=", since30d)
        .get();
      const docusignStuck = docusignSnap.size;
      // Health
      let health: "green" | "yellow" | "red" = "green";
      if (
        (billing?.status &&
          ["past_due", "canceled"].includes(billing.status)) ||
        systemIssuesCount > 3 ||
        docusignStuck > 3
      ) {
        health = "red";
      } else if (estimates30d < 2 && contracts30d < 2 && wins30d < 2) {
        health = "yellow";
      }
      // Write snapshot
      const snapshot = {
        workspaceId,
        workspaceName: ws.name ?? "",
        industry: ws.industry ?? "",
        planId: billing?.planId ?? "",
        billingStatus: billing?.status ?? "",
        mrrCents: billing?.mrrCents ?? 0,
        totalRevenueCents: billing?.totalRevenueCents ?? 0,
        activeUsers,
        estimates30d,
        contracts30d,
        wins30d,
        health,
        updatedAt: now,
        createdAt: ws.createdAt ?? now,
      };
      await db
        .doc(`founder/${founderId}/workspaceSnapshots/${workspaceId}`)
        .set(snapshot, { merge: true });
      // Issues
      if (
        billing?.status &&
        ["past_due", "canceled"].includes(billing.status)
      ) {
        await db
          .collection(`founder/${founderId}/billingIssues`)
          .add({ workspaceId, status: billing.status, createdAt: now });
      }
      if (docusignStuck > 3) {
        await db
          .collection(`founder/${founderId}/docusignQueue`)
          .add({ workspaceId, count: docusignStuck, createdAt: now });
      }
      if (systemIssuesCount > 0) {
        await db
          .collection(`founder/${founderId}/systemIssues`)
          .add({ workspaceId, count: systemIssuesCount, createdAt: now });
      }
    }
    return null;
  });
