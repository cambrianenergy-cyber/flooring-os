import { NextResponse } from "next/server";
import { getWorkspaceAiUsage } from "@/lib/getWorkspaceAiUsage";
import { getPerAgentUsage } from "@/lib/getPerAgentUsage";

// GET /api/ai-usage?workspaceId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }
  try {
    const [usage, perAgent] = await Promise.all([
      getWorkspaceAiUsage(workspaceId),
      getPerAgentUsage(workspaceId),
    ]);
    return NextResponse.json({ usage, perAgent });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
