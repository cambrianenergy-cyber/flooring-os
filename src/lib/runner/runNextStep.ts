import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { writeAuditLog } from "./audit";
import { getAgentExecutor } from "./agentRegistry";
import type { WorkflowRunDoc } from "./types";
import { computeBackoffMs, timestampFromNow } from "./retry";
import { logAgentFailure, logWorkflowFailure } from "@/lib/observability";

function mergeContext(base: any, patch: any) {
  if (!patch) return base ?? {};
  return { ...(base ?? {}), ...(patch ?? {}) };
}

export async function runNextStep(runId: string) {
  const runRef = adminDb().collection("workflow_runs").doc(runId);
  const snap = await runRef.get();
  if (!snap.exists) return { ok: false as const, reason: "not_found" as const };

  const run = snap.data() as WorkflowRunDoc;

  if (run.status === "succeeded" || run.status === "failed" || run.status === "canceled") {
    return { ok: true as const, done: true as const };
  }

  const idx = run.nextStepIndex ?? 0;
  const steps = run.steps ?? [];
  const step = steps[idx];

  if (!step) {
    // No steps left ⇒ succeed
    await runRef.update({
      status: "succeeded",
      nextRunnableAt: null,
      updatedAt: Timestamp.now(),
    });

    await writeAuditLog({
      workspaceId: run.workspaceId,
      actorType: "system",
      action: "workflow_run.succeeded",
      entityType: "workflow_runs",
      entityId: runId,
      meta: { finishedAt: new Date().toISOString() },
    });

    return { ok: true as const, done: true as const };
  }

  // If a retry is scheduled in the future, skip for now
  const nextAttemptAt = step.nextAttemptAt;
  if (
    nextAttemptAt &&
    typeof nextAttemptAt === "object" &&
    "toMillis" in nextAttemptAt &&
    typeof (nextAttemptAt as any).toMillis === "function" &&
    (nextAttemptAt as any).toMillis() > Date.now()
  ) {
    await runRef.update({ nextRunnableAt: nextAttemptAt, updatedAt: Timestamp.now() });
    return { ok: true as const, done: false as const, waitUntil: (nextAttemptAt as any).toMillis() };
  }

  // Mark step running
  const attempts = (step.attempts ?? 0) + 1;
  await runRef.update({
    status: "running",
    [`steps.${idx}.status`]: "running",
    [`steps.${idx}.startedAt`]: Timestamp.now(),
    [`steps.${idx}.attempts`]: attempts,
    [`steps.${idx}.nextAttemptAt`]: null,
    nextRunnableAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await writeAuditLog({
    workspaceId: run.workspaceId,
    actorType: "system",
    action: "workflow_step.started",
    entityType: "workflow_runs",
    entityId: runId,
    meta: { stepIndex: idx, stepId: step.stepId, agentType: step.agentType },
  });

  try {
    const exec = getAgentExecutor(step.agentType);

    const result = await exec({
      workspaceId: run.workspaceId,
      instruction: step.instruction,
      context: run.context ?? {},
      stepIndex: idx,
      stepId: step.stepId,
    });

    const newContext = mergeContext(run.context, result.contextPatch);

    await runRef.update({
      context: newContext,
      [`steps.${idx}.status`]: "succeeded",
      [`steps.${idx}.finishedAt`]: Timestamp.now(),
      [`steps.${idx}.output`]: result.output ?? null,
      nextStepIndex: idx + 1,
      nextRunnableAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await writeAuditLog({
      workspaceId: run.workspaceId,
      actorType: "system",
      action: "workflow_step.succeeded",
      entityType: "workflow_runs",
      entityId: runId,
      meta: { stepIndex: idx, stepId: step.stepId, agentType: step.agentType },
    });

    return { ok: true as const, done: false as const };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    const maxAttempts = step.maxAttempts ?? 3;
    const baseDelay = step.retryDelayMs ?? 2000;

    if (attempts < maxAttempts) {
      const backoffMs = computeBackoffMs(baseDelay, attempts);
      const nextAttemptAt = timestampFromNow(backoffMs);

      await runRef.update({
        [`steps.${idx}.status`]: "pending",
        [`steps.${idx}.finishedAt`]: Timestamp.now(),
        [`steps.${idx}.error`]: message,
        [`steps.${idx}.nextAttemptAt`]: nextAttemptAt,
        status: "queued",
        nextRunnableAt: nextAttemptAt,
        lastError: { message, stepIndex: idx, at: Timestamp.now() },
        updatedAt: Timestamp.now(),
      });

      await writeAuditLog({
        workspaceId: run.workspaceId,
        actorType: "system",
        action: "workflow_step.retry_scheduled",
        entityType: "workflow_runs",
        entityId: runId,
        meta: { stepIndex: idx, stepId: step.stepId, agentType: step.agentType, message, attempts, maxAttempts, nextAttemptAt: nextAttemptAt.toMillis() },
      });

      return { ok: true as const, done: false as const, retryScheduled: true as const, backoffMs: backoffMs, nextAttemptAt: nextAttemptAt.toMillis() };
    }

    await runRef.update({
      [`steps.${idx}.status`]: "failed",
      [`steps.${idx}.finishedAt`]: Timestamp.now(),
      [`steps.${idx}.error`]: message,
      [`steps.${idx}.nextAttemptAt`]: null,
      status: "failed",
      nextRunnableAt: null,
      lastError: { message, stepIndex: idx, at: Timestamp.now() },
      updatedAt: Timestamp.now(),
    });

    // Log observability records for failed step
    await logWorkflowFailure({
      workspaceId: run.workspaceId,
      workflowId: run.workflowId,
      runId,
      stepId: step.stepId ?? null,
      errorCode: null,
      message,
      details: { agentType: step.agentType, attempts, maxAttempts },
      occurredAt: Date.now(),
      resolvedAt: null,
      resolvedByUserId: null,
      status: "open",
      retryAttempt: attempts,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    await logAgentFailure({
      workspaceId: run.workspaceId,
      runId,
      agentId: (step as any)?.agentId ?? null,
      level: "error",
      message,
      payload: { stepIndex: idx, agentType: step.agentType },
      stepId: step.stepId ?? null,
      spanId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    await writeAuditLog({
      workspaceId: run.workspaceId,
      actorType: "system",
      action: "workflow_step.failed",
      entityType: "workflow_runs",
      entityId: runId,
      meta: { stepIndex: idx, stepId: step.stepId, agentType: step.agentType, message },
    });

    return { ok: false as const, reason: "step_failed" as const, message };
  }
}
