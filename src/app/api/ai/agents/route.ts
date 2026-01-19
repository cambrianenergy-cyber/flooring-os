
import { NextResponse } from "next/server";
import { agentRegistry } from "../agents/registry";
import { requireAiBudget } from "@/lib/metering";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const userRole = url.searchParams.get("userRole") || req.headers.get("x-user-role") || "";
  const workspaceId = url.searchParams.get("workspaceId") || req.headers.get("x-workspace-id") || null;
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }
  try {
    await requireAiBudget(workspaceId);
  } catch (err: any) {
    if (err?.message === "AI_CREDITS_EXHAUSTED") {
      return NextResponse.json({ error: "Upgrade for more AI" }, { status: 402 });
    }
    return NextResponse.json({ error: err?.message || "AI metering error" }, { status: 403 });
  }
  if (!["founder", "owner", "admin"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(agentRegistry);
}
