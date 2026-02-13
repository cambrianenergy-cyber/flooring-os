/**
 * A. Overview KPI Cards
 *
 * Data Source:
 *   Most recent global snapshot
 *
 * Query:
 *   founder/{founderId}/globalSnapshots
 *   orderBy createdAt desc
 *   limit 1
 *
 * Fields consumed:
 *   - totalWorkspaces
 *   - activeWorkspaces
 *   - totalUsers
 *   - totalMRRCents
 *   - totalRevenueCents
 *   - agentRuns30d
 *   - churnRatePct
 */
import { FounderSnapshot } from "@/types/founderSnapshot";
import { WorkspaceSnapshot } from "@/types/workspaceSnapshot";

// If WorkspaceSnapshot does not include mrrCents and other fields, extend it here for now:
type ExtendedWorkspaceSnapshot = WorkspaceSnapshot & {
  mrrCents?: number;
  totalRevenueCents?: number;
  userCount?: number;
  agentRuns30d?: number;
  estimates30d?: number;
  contracts30d?: number;
  signed30d?: number;
};

// If you control the WorkspaceSnapshot type, ensure it includes workspaceName:
import {
    collection,
    doc,
    getDocs,
    serverTimestamp,
    setDoc,
    Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Aggregates and writes a founder-level global snapshot for the given founderUserId.
 * Reads all workspaces for the founder, aggregates KPIs, and writes to founder/{founderUserId}/globalSnapshots.
 */
type Workspace = {
  id: string;
  founderUserId: string;
  status?: string;
  activeUsers?: number;
  agentRuns30d?: number;
  mrrCents?: number;
  totalRevenueCents?: number;
  workspaceName?: string;
  industry?: string;
  plan?: string;
  health?: string;
  updatedAt?: Timestamp;
  estimates30d?: number;
  contracts30d?: number;
  signed30d?: number;
};

export async function aggregateFounderGlobalSnapshot(founderUserId: string) {
  const workspacesSnap = await getDocs(collection(db, "workspaces"));
  const workspaces = workspacesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Workspace)
    .filter((ws) => ws.founderUserId === founderUserId);

  const totalWorkspaces = workspaces.length;
  const activeWorkspaces = workspaces.filter(
    (ws) => ws.status === "active",
  ).length;
  const totalUsers = workspaces.reduce(
    (sum, ws) => sum + (ws.activeUsers || 0),
    0,
  );
  const agentRuns30d = workspaces.reduce(
    (sum, ws) => sum + (ws.agentRuns30d || 0),
    0,
  );
  const totalMRRCents = workspaces.reduce(
    (sum, ws) => sum + (ws.mrrCents || 0),
    0,
  );
  const totalRevenueCents = workspaces.reduce(
    (sum, ws) => sum + (ws.totalRevenueCents || 0),
    0,
  );

  const snapshot: FounderSnapshot = {
    founderUserId,
    snapshotId: `${Date.now()}`,
    totalWorkspaces,
    activeWorkspaces,
    totalUsers,
    agentRuns30d,
    totalMRRCents,
    totalRevenueCents,
    churnRatePct: undefined, // TODO: calculate if available
    createdAt: serverTimestamp() as Timestamp,
  };

  const snapRef = doc(
    collection(db, `founder/${founderUserId}/globalSnapshots`),
  );
  await setDoc(snapRef, snapshot);
  return snapshot;
}

/**
 * Aggregates and writes workspace-level snapshots for all workspaces of a founder.
 * Writes to founder/{founderUserId}/workspaceSnapshots/{workspaceId}_{timestamp}
 */
export async function aggregateWorkspaceSnapshotsForFounder(
  founderUserId: string,
) {
  const workspacesSnap = await getDocs(collection(db, "workspaces"));
  const workspaces = workspacesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Workspace)
    .filter((ws) => ws.founderUserId === founderUserId);

  const results: WorkspaceSnapshot[] = [];
  for (const ws of workspaces) {
    const snapshot: ExtendedWorkspaceSnapshot = {
      founderUserId,
      snapshotId: `${ws.id}_${Date.now()}`,
      // workspaceName: ws.workspaceName, // Removed: not in WorkspaceSnapshot type
      createdAt: serverTimestamp() as Timestamp,
      mrrCents: ws.mrrCents || 0,
      totalRevenueCents: ws.totalRevenueCents || 0,
      userCount: ws.activeUsers || 0,
      agentRuns30d: ws.agentRuns30d || 0,
      estimates30d: ws.estimates30d || 0,
      contracts30d: ws.contracts30d || 0,
      signed30d: ws.signed30d || 0,
      // Required WorkspaceSnapshot fields (set to 1 or 0 for per-workspace snapshot)
      totalWorkspaces: 1,
      activeWorkspaces: ws.status === "active" ? 1 : 0,
      totalUsers: ws.activeUsers || 0,
      // Add any other fields needed for the dashboard
    };
    const snapRef = doc(
      collection(db, `founder/${founderUserId}/workspaceSnapshots`),
    );
    await setDoc(snapRef, snapshot);
    results.push(snapshot);
  }
  return results;
}
