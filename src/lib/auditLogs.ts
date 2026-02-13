import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { col } from "./firestorePaths";

type AuditEntityType =
  | "estimate"
  | "job"
  | "invoice"
  | "policy"
  | "member"
  | "system";

export async function writeAuditLog(args: {
  workspaceId: string;
  actorUid: string;
  action: string;
  entityType: AuditEntityType;
  entityId?: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
}) {
  const db = adminDb();
  const ref = db.collection(col(args.workspaceId, "audit_logs")).doc();

  // keep snapshots smaller to avoid huge writes
  const safeBefore = args.before
    ? JSON.parse(JSON.stringify(args.before))
    : null;
  const safeAfter = args.after ? JSON.parse(JSON.stringify(args.after)) : null;

  await ref.set({
    actorUid: args.actorUid,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId || null,
    reason: args.reason || null,
    before: safeBefore,
    after: safeAfter,
    createdAt: adminFieldValue.serverTimestamp(),
  });
}
