import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireWorkspaceMember, requireRole } from "@/lib/authz";
import { resolvePlan } from "@/lib/plans";
import { enforcePlanAndBilling } from "../../../plans/enforcePlanAndBilling";

// POST: Add or invite a team member, assign role, set permissions template, support 'invite later'
export async function POST(req: Request, { params }: { params: { workspaceId: string } }) {
  const uid = req.headers.get("x-debug-uid"); // Replace with real auth
  if (!uid) return new NextResponse("UNAUTHENTICATED", { status: 401 });
  const { workspaceId } = params;

  // Enforce plan and billing (user cap, billing status, etc.)
  const enforcement = await enforcePlanAndBilling(workspaceId, "users");
  if (!enforcement.allowed) {
    return new NextResponse(enforcement.reason || "Access denied", { status: 403 });
  }

  const member = await requireWorkspaceMember(workspaceId, uid);
  requireRole(member.role, ["owner", "admin"]);

  const db = adminDb();
  const ws = await db.collection("workspaces").doc(workspaceId).get();
  if (!ws.exists) return new NextResponse("Workspace not found", { status: 404 });

  const { email, role, permissionsTemplate, inviteLater } = await req.json();
  if (!email) return new NextResponse("Email required", { status: 400 });

  const inviteUid = `invited:${email.toLowerCase()}`;
  const id = `${workspaceId}_${inviteUid}`;

  await db.collection("workspace_members").doc(id).set({
    workspaceId,
    uid: inviteUid,
    role: role || "sales",
    status: inviteLater ? "pending" : "invited",
    invitedEmail: email,
    invitedByUid: uid,
    permissionsTemplate: permissionsTemplate || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}

// PATCH: Update member role/permissions
export async function PATCH(req: Request, { params }: { params: { workspaceId: string } }) {
  const uid = req.headers.get("x-debug-uid");
  if (!uid) return new NextResponse("UNAUTHENTICATED", { status: 401 });
  const { workspaceId } = params;
  const { email, role, permissionsTemplate } = await req.json();
  if (!email) return new NextResponse("Email required", { status: 400 });
  const id = `${workspaceId}_invited:${email.toLowerCase()}`;
  await adminDb().collection("workspace_members").doc(id).set({
    role,
    permissionsTemplate: permissionsTemplate || null,
    updatedAt: new Date(),
  }, { merge: true });
  return NextResponse.json({ ok: true });
}

// DELETE: Remove member
export async function DELETE(req: Request, { params }: { params: { workspaceId: string } }) {
  const uid = req.headers.get("x-debug-uid");
  if (!uid) return new NextResponse("UNAUTHENTICATED", { status: 401 });
  const { workspaceId } = params;
  const { email } = await req.json();
  if (!email) return new NextResponse("Email required", { status: 400 });
  const id = `${workspaceId}_invited:${email.toLowerCase()}`;
  await adminDb().collection("workspace_members").doc(id).set({
    status: "removed",
    removedAt: new Date(),
    updatedAt: new Date(),
  }, { merge: true });
  return NextResponse.json({ ok: true });
}
