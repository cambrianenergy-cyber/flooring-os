import { NextResponse } from "next/server";
import { runWorkflow } from "@/lib/workflows";
import { requireWorkspaceMember, requireRole } from "@/lib/authz";

function getUidFromRequest(req: Request) {
  const uid = req.headers.get("x-debug-uid"); // replace with real auth
  if (!uid) throw new Error("UNAUTHENTICATED");
  return uid;
}


export async function POST(req: Request, context: { params: Promise<{ workspaceId: string }> }) {
  const { params } = context;
  const { workspaceId } = await params;
  const uid = getUidFromRequest(req);

  const member = await requireWorkspaceMember(workspaceId, uid);
  requireRole(member.role, ["owner", "admin"]);

  const { workflowId, input } = await req.json();
  const out = await runWorkflow(workspaceId, workflowId, input || {});
  return NextResponse.json(out);
}
