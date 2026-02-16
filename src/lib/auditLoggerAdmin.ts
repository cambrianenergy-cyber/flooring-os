// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";
// import { Timestamp } from "firebase-admin/firestore";
const adminDb = (..._args: any[]) => ({
  collection: (..._args: any[]) => ({
    add: async (..._args: any[]) => {}
  })
});
const Timestamp = { now: () => new Date() };

export async function writeAuditLog(params: {
  workspaceId: string;
  actorType: "system" | "user" | "agent";
  action: string;
  entityType: string;
  entityId: string;
  meta?: any;
  actorId?: string;
}) {
  await adminDb().collection("audit_logs").add({
    workspaceId: params.workspaceId,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    meta: params.meta ?? {},
    createdAt: Timestamp.now(),
  });
}