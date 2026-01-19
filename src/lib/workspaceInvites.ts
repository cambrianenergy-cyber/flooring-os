import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import { WorkspaceInviteRole } from "@/lib/types";

export type WorkspaceInviteStatus = "pending" | "accepted" | "expired" | "revoked";

const DEFAULT_TTL_DAYS = 7;
const MS_PER_DAY = 86_400_000;

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function inviteTtlMs(customTtlMs?: number) {
  if (customTtlMs && Number.isFinite(customTtlMs)) return customTtlMs;
  const ttlDays = toNumber(process.env.WORKSPACE_INVITE_TTL_DAYS, DEFAULT_TTL_DAYS);
  return ttlDays * MS_PER_DAY;
}

function hashToken(token: string) {
  const salt = process.env.WORKSPACE_INVITE_TOKEN_SALT || "";
  return crypto.createHash("sha256").update(`${salt}|${token}`).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

const allowedRoles: WorkspaceInviteRole[] = [
  "owner",
  "admin",
  "member",
  "viewer",
  "estimator",
  "sales",
  "installer",
];

function assertRole(role: string): asserts role is WorkspaceInviteRole {
  if (!allowedRoles.includes(role as WorkspaceInviteRole)) {
    throw new Error("Invalid role for workspace invite");
  }
}

// Minimal Firestore surface for adminDb and fakes in tests
import type { CollectionReference, Transaction } from "firebase-admin/firestore";

type FirestoreLike = {
  collection: (name: string) => CollectionReference;
  runTransaction: <T>(fn: (txn: Transaction) => Promise<T>) => Promise<T>;
};

export async function createWorkspaceInvite(
  params: {
    workspaceId: string;
    email: string;
    role: WorkspaceInviteRole;
    invitedBy: string;
    expiresAtMs?: number;
    db?: FirestoreLike;
  }
): Promise<{ inviteId: string; token: string; expiresAt: number }>
{
  const dbInstance = params.db ? params.db : adminDb();
  const { workspaceId, email, role, invitedBy, expiresAtMs } = params;
  assertRole(role);
  if (!workspaceId || !email || !invitedBy) {
    throw new Error("workspaceId, email, and invitedBy are required");
  }

  const token = randomToken();
  const tokenHash = hashToken(token);
  const now = Date.now();
  const expiresAt = expiresAtMs ?? now + inviteTtlMs();

  const inviteRef = dbInstance.collection("workspace_invites").doc();
  await inviteRef.set({
    workspaceId,
    email,
    role,
    invitedBy,
    tokenHash,
    status: "pending" as WorkspaceInviteStatus,
    expiresAt,
    acceptedAt: null,
    acceptedBy: null,
    createdAt: now,
    updatedAt: now,
  });

  return { inviteId: inviteRef.id, token, expiresAt };
}

export async function acceptWorkspaceInvite(
  params: { workspaceId: string; token: string; userId: string; db?: FirestoreLike }
): Promise<{ inviteId: string; memberId: string }>
{
  const dbInstance = params.db ? params.db : adminDb();
  const { workspaceId, token, userId } = params;
  if (!workspaceId || !token || !userId) {
    throw new Error("workspaceId, token, and userId are required");
  }

  // --- ENFORCE TEAM LIMITS ---
  // Get workspace plan and maxUsers
  const wsDoc = await dbInstance.collection("workspaces").doc(workspaceId).get();
  if (!wsDoc.exists) throw new Error("WORKSPACE_NOT_FOUND");
  const planKey = wsDoc.data()?.plan?.key || "foundation";
  // Use resolvePlan from plans
  const { resolvePlan } = await import("@/lib/plans");
  const plan = resolvePlan(planKey);
  const maxUsers = plan.maxUsers;
  if (maxUsers !== "unlimited") {
    const membersSnap = await dbInstance.collection("workspace_members")
      .where("workspaceId", "==", workspaceId)
      .where("status", "in", ["active", "invited"])
      .get();
    if (membersSnap.size >= maxUsers) {
      throw new Error("TEAM_LIMIT_REACHED");
    }
  }
  // --- END ENFORCE TEAM LIMITS ---

  const tokenHash = hashToken(token);
  const invitesRef = dbInstance.collection("workspace_invites");
  const inviteSnap = await invitesRef
    .where("workspaceId", "==", workspaceId)
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();

  if (inviteSnap.empty) {
    throw new Error("Invite not found");
  }

  const inviteDoc = inviteSnap.docs[0];
  const inviteData = inviteDoc.data();
  const now = Date.now();

  if (inviteData.status === "revoked") {
    throw new Error("Invite revoked");
  }
  if (inviteData.status === "expired" || inviteData.expiresAt <= now) {
    throw new Error("Invite expired");
  }
  if (inviteData.status === "accepted" && inviteData.acceptedBy === userId) {
    return { inviteId: inviteDoc.id, memberId: `${workspaceId}_${userId}` };
  }

  const memberId = `${workspaceId}_${userId}`;
  const membersRef = dbInstance.collection("workspace_members");
  const memberDocRef = membersRef.doc(memberId);

  await dbInstance.runTransaction(async (txn: Transaction) => {
    const freshInviteSnap = await txn.get(inviteDoc.ref);
    if (!freshInviteSnap.exists) {
      throw new Error("Invite missing during acceptance");
    }
    const fresh = freshInviteSnap.data();
    if (!fresh) throw new Error("Invite data missing");
    if (fresh!.status === "revoked") throw new Error("Invite revoked");
    if (fresh!.status === "expired" || fresh!.expiresAt <= now) throw new Error("Invite expired");
    assertRole(fresh!.role);

    const memberSnap = await txn.get(memberDocRef);
    const memberData = memberSnap.exists ? memberSnap.data() : undefined;
    const createdAt = memberData && memberData.createdAt ? memberData.createdAt : now;

    txn.update(inviteDoc.ref, {
      status: "accepted" as WorkspaceInviteStatus,
      acceptedAt: now,
      acceptedBy: userId,
      updatedAt: now,
    });

    txn.set(
      memberDocRef,
      {
        workspaceId,
        userId,
        role: fresh!.role,
        permissions: {},
        canViewFinancials: false,
        canEditPricing: false,
        canDeleteJobs: false,
        status: "active",
        invitedByUserId: fresh!.invitedBy ?? null,
        createdAt,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  return { inviteId: inviteDoc.id, memberId };
}

export async function expireWorkspaceInvites(
  params: { now?: number; db?: FirestoreLike; limit?: number } = {}
): Promise<{ expired: number }>
{
  const dbInstance = params.db ? params.db : adminDb();
  const { now = Date.now(), limit = 500 } = params;
  const snap = await dbInstance
    .collection("workspace_invites")
    .where("status", "==", "pending")
    .where("expiresAt", "<=", now)
    .limit(limit)
    .get();

  let expired = 0;
  for (const doc of snap.docs) {
    await doc.ref.update({ status: "expired", updatedAt: now });
    expired += 1;
  }
  return { expired };
}

export async function sendWorkspaceInviteEmail(params: { email: string; token: string; workspaceId: string }) {
  // Stub for production email delivery; replace with your provider (SendGrid, SES, etc.).
  console.info("Workspace invite email", params);
}
