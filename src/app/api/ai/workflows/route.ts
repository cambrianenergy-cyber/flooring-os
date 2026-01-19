import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      workspaceId,
      name,
      status = "active",
      steps = [],
    } = body;

    if (!workspaceId || !name) {
      return NextResponse.json({ ok: false, error: "workspaceId and name required" }, { status: 400 });
    }

    if (!Array.isArray(steps)) {
      return NextResponse.json({ ok: false, error: "steps must be an array" }, { status: 400 });
    }

    // Basic normalization and ordering
    const normalizedSteps = steps
      .slice()
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((s: any, idx: number) => ({
        stepId: s.stepId ?? crypto.randomUUID(),
        order: s.order ?? idx,
        agentType: s.agentType,
        instruction: s.instruction,
        status: s.status ?? "pending",
        attempts: s.attempts ?? 0,
      }));

    const doc = {
      workspaceId,
      name,
      status,
      steps: normalizedSteps,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const ref = await adminDb().collection("workflows").add(doc);
    return NextResponse.json({ ok: true, workflowId: ref.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
