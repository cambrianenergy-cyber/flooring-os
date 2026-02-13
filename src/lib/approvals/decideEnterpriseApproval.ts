import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/firebase/client";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

export async function decideEnterpriseApproval(args: {
  workspaceId: string;
  approvalId: string;
  estimateId: string;
  decidedByUserId: string;
  decision: "approved" | "denied";
}) {
  await updateDoc(doc(db, "estimate_approvals", args.approvalId), {
    status: args.decision,
    decidedByUserId: args.decidedByUserId,
    decidedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "estimates", args.estimateId), {
    "pricing.enterpriseApproved": args.decision === "approved",
    "pricing.enterpriseApprovedByUserId": args.decidedByUserId,
    "pricing.enterpriseApprovedAt": serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    workspaceId: args.workspaceId,
    actorUserId: args.decidedByUserId,
    action: `estimate.enterprise.${args.decision}`,
    meta: { approvalId: args.approvalId },
  });
}
