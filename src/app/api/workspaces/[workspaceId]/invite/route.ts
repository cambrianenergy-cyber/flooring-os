import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireWorkspaceMember, requireRole } from "@/lib/authz";
import { resolvePlan } from "@/lib/plans";

// NOTE: you’d validate auth token and extract uid in your real auth middleware
function getUidFromRequest(req: Request) {
  const uid = req.headers.get("x-debug-uid"); // replace with real Firebase auth verification
  if (!uid) throw new Error("UNAUTHENTICATED");
  return uid;
}


export async function POST(req: Request, context: { params: Promise<{ workspaceId: string }> }) {
  const { params } = context;
  const { workspaceId } = await params;
  const uid = getUidFromRequest(req);

  const member = await requireWorkspaceMember(workspaceId, uid);
  requireRole(member.role, ["owner", "admin"]);

  const db = adminDb();
  const ws = await db.collection("workspaces").doc(workspaceId).get();
  if (!ws.exists) return new NextResponse("Workspace not found", { status: 404 });

  const plan = resolvePlan(ws.data()!.plan?.key);

  const membersSnap = await db.collection("workspace_members")
    .where("workspaceId", "==", workspaceId)
    .where("status", "in", ["active", "invited"])
    .get();

  const count = membersSnap.size;
  if (plan.maxUsers !== "unlimited" && count >= plan.maxUsers) {
    return new NextResponse("Team limit reached for current plan", { status: 403 });
  }

  const { email, role } = await req.json();

  // Create invited member stub
  const inviteUid = `invited:${email.toLowerCase()}`; // replace with real invite acceptance flow
  const id = `${workspaceId}_${inviteUid}`;

  await db.collection("workspace_members").doc(id).set({
    workspaceId,
    uid: inviteUid,
    role: role || "sales",
    status: "invited",
    invitedEmail: email,
    invitedByUid: uid,
    createdAt: new Date(),
    updatedAt: new Date(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
