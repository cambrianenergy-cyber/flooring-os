import { requireWorkspaceMember } from "@/lib/authz";
import { getWorkspacePlan, requireActiveBilling } from "@/lib/featureGate";
import { recordAiUsage, requireAiBudget } from "@/lib/metering";
import { NextResponse } from "next/server";

import { getAuth } from "firebase-admin/auth";
async function getUid(req: Request): Promise<string> {
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
  const uid = await getUid(req);

  await requireWorkspaceMember(workspaceId, uid);

  const { status } = await getWorkspacePlan(workspaceId);
  requireActiveBilling(status);

  // enforce AI budget
  try {
    await requireAiBudget(workspaceId);
  } catch (err: unknown) {
    let message = "AI metering error";
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as Error).message === "string"
    ) {
      message = (err as Error).message;
    }
    if (message === "AI_CREDITS_EXHAUSTED") {
      return NextResponse.json(
        { error: "Upgrade for more AI" },
        { status: 402 },
      );
    }
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const body = await req.json();
  // TODO: Call your actual LLM here.
  const tokensUsed = 900;

  await recordAiUsage({
    workspaceId,
    uid,
    kind: "chat",
    tokens: tokensUsed,
    model: "gpt-5",
    entityType: body.entityType || null,
    entityId: body.entityId || null,
  });

  return NextResponse.json({ ok: true, result: { message: "AI output here" } });
}
