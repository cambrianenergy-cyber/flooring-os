// Server-only code removed for static export
// import { adminDb } from "@/lib/firebase/admin";
const adminDb = { collection: (..._args: any[]) => ({ add: async (..._args: any[]) => {} }) };

export async function writeBillingAuditLog({
  workspaceId,
  actorUserId = null,
  action,
  meta = {},
}: {
  workspaceId: string;
  actorUserId?: string | null;
  action: string;
  meta?: Record<string, any>;
}) {
  await adminDb.collection("billing_audit_logs").add({
    workspaceId,
    actorUserId: actorUserId || null,
    action,
    meta,
    createdAt: new Date(),
  });
}
