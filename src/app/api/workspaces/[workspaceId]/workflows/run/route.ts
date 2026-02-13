import { requireRole, requireWorkspaceMember } from "@/lib/authz";
import { runWorkflow } from "@/lib/workflows";
import { NextResponse } from "next/server";

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

  const { workflowId, input } = await req.json();
  const out = await runWorkflow(workspaceId, workflowId, input || {});
  return NextResponse.json(out);
}
