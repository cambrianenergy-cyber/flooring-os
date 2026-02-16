import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export async function approveEstimate(
  estimateId: string,
  workspaceId: string,
  reason: string,
  user: { uid: string }
) {
  if (!user) throw new Error("User not authenticated");
  // Update estimate status
  await updateDoc(doc(db, "estimates", estimateId), {
    status: "approved",
    needsApproval: false,
    approvalReason: reason,
    approvedBy: user.uid,
    approvedAt: serverTimestamp(),
  });
  // Log to audit_logs
  await addDoc(collection(db, "workspaces", workspaceId, "audit_logs"), {
    actorUid: user.uid,
    action: "approve_estimate",
    entityType: "estimate",
    entityId: estimateId,
    reason,
    createdAt: serverTimestamp(),
    before: null, // Optionally fetch and store previous state
    after: { status: "approved" },
  });
}

export async function rejectEstimate(
  estimateId: string,
  workspaceId: string,
  reason: string,
  user: { uid: string }
) {
  if (!user) throw new Error("User not authenticated");
  await updateDoc(doc(db, "estimates", estimateId), {
    status: "rejected",
    needsApproval: false,
    rejectionReason: reason,
    rejectedBy: user.uid,
    rejectedAt: serverTimestamp(),
  });
  await addDoc(collection(db, "workspaces", workspaceId, "audit_logs"), {
    actorUid: user.uid,
    action: "reject_estimate",
    entityType: "estimate",
    entityId: estimateId,
    reason,
    createdAt: serverTimestamp(),
    before: null,
    after: { status: "rejected" },
  });
}
