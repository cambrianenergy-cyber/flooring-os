"use server";

import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { requireWorkspace, requireFounder } from "@/lib/requireAuth";
import { docPath } from "@/lib/firestorePaths";
import { writeAuditLog } from "@/lib/auditLogs";

function toNumber(x: unknown, fallback: number) {
  const n = typeof x === "string" ? Number(x) : typeof x === "number" ? x : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/** Founder approves an estimate exception (discount/margin) */
export async function approveEstimate(params: { estimateId: string; reason: string }) {
  const user = await requireFounder();
  const db = adminDb();
  const ref = db.doc(docPath(user.workspaceId, "estimates", params.estimateId));
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Estimate not found.");

  const before = snap.data();

  await ref.update({
    status: "sent",
    approval: {
      approvedBy: user.uid,
      approvedAt: adminFieldValue.serverTimestamp(),
      reason: params.reason,
    },
    updatedAt: adminFieldValue.serverTimestamp(),
  });

  const afterSnap = await ref.get();
  await writeAuditLog({
    workspaceId: user.workspaceId,
    actorUid: user.uid,
    action: "estimate.approve",
    entityType: "estimate",
    entityId: params.estimateId,
    reason: params.reason,
    before,
    after: afterSnap.data(),
  });
}

/** Founder rejects an estimate exception */
export async function rejectEstimate(params: { estimateId: string; reason: string }) {
  const user = await requireFounder();
  const db = adminDb();
  const ref = db.doc(docPath(user.workspaceId, "estimates", params.estimateId));
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Estimate not found.");

  const before = snap.data();

  await ref.update({
    status: "rejected",
    rejection: {
      rejectedBy: user.uid,
      rejectedAt: adminFieldValue.serverTimestamp(),
      reason: params.reason,
    },
    updatedAt: adminFieldValue.serverTimestamp(),
  });

  const afterSnap = await ref.get();
  await writeAuditLog({
    workspaceId: user.workspaceId,
    actorUid: user.uid,
    action: "estimate.reject",
    entityType: "estimate",
    entityId: params.estimateId,
    reason: params.reason,
    before,
    after: afterSnap.data(),
  });
}

/** Move a job to a new status (kanban) */
export async function moveJob(params: { jobId: string; status: "scheduled" | "in_progress" | "blocked" | "completed"; blockedReason?: string }) {
  const user = await requireWorkspace();
  const db = adminDb();

  const ref = db.doc(docPath(user.workspaceId, "jobs", params.jobId));
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Job not found.");

  const before = snap.data();

  await ref.update({
    status: params.status,
    blockedReason: params.status === "blocked" ? (params.blockedReason || "blocked") : adminFieldValue.delete(),
    updatedAt: adminFieldValue.serverTimestamp(),
  });

  const afterSnap = await ref.get();
  await writeAuditLog({
    workspaceId: user.workspaceId,
    actorUid: user.uid,
    action: "job.move_status",
    entityType: "job",
    entityId: params.jobId,
    reason: params.blockedReason,
    before,
    after: afterSnap.data(),
  });
}

/** Mark invoice status */
export async function setInvoiceStatus(params: { invoiceId: string; status: "draft" | "sent" | "partial" | "paid" | "overdue"; reason?: string }) {
  const user = await requireWorkspace();
  const db = adminDb();

  const ref = db.doc(docPath(user.workspaceId, "invoices", params.invoiceId));
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Invoice not found.");

  const before = snap.data();

  await ref.update({
    status: params.status,
    updatedAt: adminFieldValue.serverTimestamp(),
  });

  const afterSnap = await ref.get();
  await writeAuditLog({
    workspaceId: user.workspaceId,
    actorUid: user.uid,
    action: "invoice.set_status",
    entityType: "invoice",
    entityId: params.invoiceId,
    reason: params.reason,
    before,
    after: afterSnap.data(),
  });
}

/** Update founder policies */
export async function updatePolicies(form: {
  marginFloorPct: string;
  maxDiscountPct: string;
  lockdownMode?: string; // "on" if checked
  reason: string;
}) {
  const user = await requireFounder();
  const db = adminDb();

  const policyRef = db.doc(docPath(user.workspaceId, "policies", "global"));
  const snap = await policyRef.get();
  const before = snap.exists ? snap.data() : null;

  const marginFloorPct = toNumber(form.marginFloorPct, 40);
  const maxDiscountPct = toNumber(form.maxDiscountPct, 10);
  const lockdownMode = form.lockdownMode === "on";

  await policyRef.set(
    {
      marginFloorPct,
      maxDiscountPct,
      lockdownMode,
      updatedAt: adminFieldValue.serverTimestamp(),
      updatedBy: user.uid,
    },
    { merge: true }
  );

  const afterSnap = await policyRef.get();
  await writeAuditLog({
    workspaceId: user.workspaceId,
    actorUid: user.uid,
    action: "policy.update",
    entityType: "policy",
    entityId: "global",
    reason: form.reason,
    before,
    after: afterSnap.data(),
  });
}
