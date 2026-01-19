
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { isFounder } from "@/lib/auth-utils";
import { requireWorkspaceMember } from "@/lib/authz";
import { writeAuditLog } from "@/lib/auditLoggerAdmin";

export async function POST(req: Request) {
  const { workspaceId } = await req.json();
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

  // Extract user info from headers (assume x-uid and x-email for server auth)
  const uid = req.headers.get("x-uid") || "";
  const actorEmail = req.headers.get("x-email") || "";
  let allowed = false;
  let actorRole = "";
  try {
    if (isFounder(actorEmail)) {
      allowed = true;
      actorRole = "founder";
    } else {
      const member = await requireWorkspaceMember(workspaceId, uid);
      if (["owner", "admin"].includes(member.role)) {
        allowed = true;
        actorRole = member.role;
      }
    }
  } catch (err) {
    // Not a member or not allowed
  }
  if (!allowed) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // Reset AI/workflow quota fields
  await adminDb().collection("workspaces").doc(workspaceId).update({
    aiUsage: 0,
    workflowUsage: 0,
    aiQuotaResetAt: new Date(),
    workflowQuotaResetAt: new Date(),
  });

  // Audit log
  await writeAuditLog({
    workspaceId,
    actorType: "user",
    actorId: uid,
    action: "reset-quota",
    entityType: "workspace",
    entityId: workspaceId,
    meta: { actorEmail, actorRole },
  });

  return NextResponse.json({ success: true });
}
