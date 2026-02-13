const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Import the aggregation logic from the main app (adjust path as needed)
const {
  aggregateFounderGlobalSnapshot,
  aggregateWorkspaceSnapshotsForFounder,
} = require("../src/lib/aggregateFounderSnapshots");

/**
 * Scheduled function to aggregate founder/global and workspace snapshots for all founders.
 * Runs every hour.
 */
exports.aggregateFounderSnapshots = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async (context) => {
    const db = admin.firestore();
    // Get all unique founderUserIds from workspaces
    const workspacesSnap = await db.collection("workspaces").get();
    const founderUserIds = Array.from(
      new Set(workspacesSnap.docs.map((doc) => doc.data().founderUserId)),
    );
    for (const founderUserId of founderUserIds) {
      await aggregateFounderGlobalSnapshot(founderUserId);
      await aggregateWorkspaceSnapshotsForFounder(founderUserId);
    }
    return null;
  });
