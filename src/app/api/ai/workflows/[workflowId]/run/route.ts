
import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeAgentType } from "@/lib/normalizeAgentType";
import { getWorkspaceEntitlements } from "@/lib/server/workspaceEntitlements";
import { requireFeature } from "@/lib/plans/requireFeature";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const workspaceId = body.workspaceId as string;
  const workflowContext = body.context ?? {};

  if (!workspaceId) {
    return NextResponse.json({ ok: false, error: "workspaceId required" }, { status: 400 });
  }

  const wfRef = adminDb().collection("workflows").doc(workflowId);
  const wfSnap = await wfRef.get();
  if (!wfSnap.exists) {
    return NextResponse.json({ ok: false, error: "Workflow not found" }, { status: 404 });
  }

  const wf = wfSnap.data() as any;
  if (wf.workspaceId !== workspaceId) {
    return NextResponse.json({ ok: false, error: "Workspace mismatch" }, { status: 403 });
  }

  const entitlements = await getWorkspaceEntitlements(workspaceId);
  try {
    requireFeature(entitlements.entitlements, "aiIntelligence");
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Feature not enabled", code: "FEATURE_DISABLED", feature: e?.feature },
      { status: e?.status ?? 403 }
    );
  }

  const steps: Array<{ agentType: string | null } & Record<string, any>> = (wf.steps ?? [])
    .slice()
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((s: any) => ({
      stepId: s.stepId ?? crypto.randomUUID(),
      order: s.order ?? 0,
      agentType: normalizeAgentType(s.agentType),
      instruction: s.instruction,
      status: "pending",
      attempts: 0,
      maxAttempts: s.maxAttempts ?? 3,
      retryDelayMs: s.retryDelayMs ?? 2000,
      nextAttemptAt: null,
      output: null,
      error: null,
    }));

  const invalid = steps.find((s) => !s.agentType);
  if (invalid) {
    return NextResponse.json({ ok: false, error: "Invalid agentType in workflow steps" }, { status: 400 });
  }

  const runDoc = {
    workspaceId,
    workflowId,
    status: "queued",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    nextRunnableAt: Timestamp.now(),
    lock: null,
    nextStepIndex: 0,
    attempt: 0,
    lastError: null,
    steps,
    context: workflowContext,
  };

  const runRef = await adminDb().collection("workflow_runs").add(runDoc);

  return NextResponse.json({ ok: true, runId: runRef.id });
}
