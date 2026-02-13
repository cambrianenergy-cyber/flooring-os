import { requireRole, requireWorkspaceMember } from "@/lib/authz";
import { adminDb } from "@/lib/firebaseAdmin";
import { resolvePlan } from "@/lib/plans";
import { NextResponse } from "next/server";

// Helper to extract and verify uid from Firebase ID token (production)
import { getAuth } from "firebase-admin/auth";
async function getUidFromRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new Error("UNAUTHENTICATED");
  const token = authHeader.split("Bearer ")[1];
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const { params } = context;
  const { workspaceId } = await params;
  const uid = await getUidFromRequest(req);

  const member = await requireWorkspaceMember(workspaceId, uid);
  requireRole(member.role, ["owner", "admin"]);

  const db = adminDb();
  const ws = await db.collection("workspaces").doc(workspaceId).get();
  if (!ws.exists)
    return new NextResponse("Workspace not found", { status: 404 });

  const plan = resolvePlan(ws.data()!.plan?.key);

  const membersSnap = await db
    .collection("workspace_members")
    .where("workspaceId", "==", workspaceId)
    .where("status", "in", ["active", "invited"])
    .get();

  const count = membersSnap.size;
  if (plan.maxUsers !== "unlimited" && count >= plan.maxUsers) {
    return new NextResponse("Team limit reached for current plan", {
      status: 403,
    });
  }

  const { email, role } = await req.json();

  // Create invited member stub
  const inviteUid = `invited:${email.toLowerCase()}`; // replace with real invite acceptance flow
  const id = `${workspaceId}_${inviteUid}`;

  await db
    .collection("workspace_members")
    .doc(id)
    .set(
      {
        workspaceId,
        uid: inviteUid,
        role: role || "sales",
        status: "invited",
        invitedEmail: email,
        invitedByUid: uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true });
}
