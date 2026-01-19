import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function POST(req: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    const body = await req.json().catch(() => ({}));
    const stepIndex = body.stepIndex as number | undefined;

    const { runId } = await context.params;
    const runRef = adminDb().collection("workflow_runs").doc(runId);
    const snap = await runRef.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Run not found" }, { status: 404 });
    }

    const run = snap.data() as any;
    const steps = run.steps ?? [];
    const idx = typeof stepIndex === "number" ? stepIndex : (run.nextStepIndex ?? 0);

    if (!steps[idx]) {
      return NextResponse.json({ ok: false, error: "Invalid stepIndex" }, { status: 400 });
    }

    // Clear cooldown + set queued
    await runRef.update({
      status: "queued",
      [`steps.${idx}.nextAttemptAt`]: null,
      [`steps.${idx}.status`]: "pending",
      nextRunnableAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to retry step:", e);
    const errorMsg = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);
    return NextResponse.json({ ok: false, error: errorMsg || "Failed to retry step" }, { status: 500 });
  }
}
