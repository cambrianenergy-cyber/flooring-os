import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export async function requestEnterpriseApproval(args: {
  workspaceId: string;
  estimateId: string;
  requestedByUserId: string;
  reason?: string;
}) {
  const approvalRef = await addDoc(collection(db, "estimate_approvals"), {
    workspaceId: args.workspaceId,
    estimateId: args.estimateId,
    type: "enterprise_price",
    status: "pending",
    reason: args.reason ?? "",
    requestedByUserId: args.requestedByUserId,
    requestedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "estimates", args.estimateId), {
    "pricing.enterpriseRequested": true,
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    workspaceId: args.workspaceId,
    actorUserId: args.requestedByUserId,
    action: "estimate.enterprise.request",
    meta: { approvalId: approvalRef.id },
  });

  return approvalRef.id;
}
