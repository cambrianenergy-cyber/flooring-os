
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { isFounder } from "@/lib/auth-utils";
import { requireWorkspaceMember } from "@/lib/authz";
import { writeAuditLog } from "@/lib/auditLoggerAdmin";

export async function POST(req: Request) {
  const { workspaceId, email } = await req.json();
  if (!workspaceId || !email) return NextResponse.json({ error: "Missing workspaceId or email" }, { status: 400 });

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

  // Add user to workspace_members with status 'invited'
  const docId = `${workspaceId}_${email}`;
  await adminDb().collection("workspace_members").doc(docId).set({
    workspaceId,
    email,
    status: "invited",
    invitedAt: new Date(),
  }, { merge: true });

  // Audit log
  await writeAuditLog({
    workspaceId,
    actorType: "user",
    actorId: uid,
    action: "force-invite",
    entityType: "workspace_member",
    entityId: docId,
    meta: { invitedEmail: email, actorEmail, actorRole },
  });

  return NextResponse.json({ success: true });
}
