
import { NextResponse } from "next/server";
import { requireAiBudget } from "@/lib/metering";

export async function POST(req: Request) {
  const body = await req.json();
  const { conversationId, workspaceId } = body;
  if (!conversationId) {
    return NextResponse.json({ ok: false, error: "Missing conversationId" }, { status: 400 });
  }
  if (!workspaceId) {
    return NextResponse.json({ ok: false, error: "Missing workspaceId" }, { status: 400 });
  }
  try {
    await requireAiBudget(workspaceId);
  } catch (err: any) {
    if (err?.message === "AI_CREDITS_EXHAUSTED") {
      return NextResponse.json({ error: "Upgrade for more AI" }, { status: 402 });
    }
    return NextResponse.json({ error: err?.message || "AI metering error" }, { status: 403 });
  }
  // Simulate AI draft
  return NextResponse.json({ ok: true, draft: "Hi! Thanks for reaching out. How can I help you with your flooring project?" });
}
