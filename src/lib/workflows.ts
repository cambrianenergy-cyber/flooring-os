import { adminDb } from "./firebaseAdmin";
import { resolvePlan } from "./plans";
import { recordAiUsage, requireAiBudget } from "./metering";

type Step = { id: string; type: string; config: Record<string, unknown> };

export async function runWorkflow(workspaceId: string, workflowId: string, input: Record<string, unknown>) {

  const db = adminDb();
  const wsSnap = await db.collection("workspaces").doc(workspaceId).get();
  if (!wsSnap.exists) throw new Error("WORKSPACE_NOT_FOUND");
  const plan = resolvePlan(wsSnap.data()!.plan?.key);

  if (!plan.workflow.enabled) throw new Error("WORKFLOWS_NOT_AVAILABLE");

  // Enforce maxRunsPerMonth if not unlimited
  if (plan.workflow.maxRunsPerMonth !== "unlimited") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthlyRunsSnap = await db.collection("workflow_runs")
      .where("workspaceId", "==", workspaceId)
      .where("createdAt", ">=", monthStart)
      .where("createdAt", "<", nextMonthStart)
      .get();
    if (monthlyRunsSnap.size >= plan.workflow.maxRunsPerMonth) {
      throw new Error("WORKFLOW_RUN_LIMIT_REACHED");
    }
  }

  // Create run
  const runRef = db.collection("workflow_runs").doc();
  await runRef.set({
    workspaceId,
    workflowId,
    status: "queued",
    cursor: 0,
    input,
    startedAt: null,
    endedAt: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const wfSnap = await db.collection("workflows").doc(workflowId).get();
  if (!wfSnap.exists) throw new Error("WORKFLOW_NOT_FOUND");
  const wf = wfSnap.data() as { steps: Step[]; enabled: boolean };

  if (!wf.enabled) throw new Error("WORKFLOW_DISABLED");

  // Execute sequential steps (simple, safe baseline)
  await runRef.update({ status: "running", startedAt: new Date(), updatedAt: new Date() });

  function getString(obj: Record<string, unknown>, key: string): string | null {
    const val = obj[key];
    return typeof val === "string" ? val : null;
  }

  for (let i = 0; i < wf.steps.length; i++) {
    const step = wf.steps[i];
    await runRef.update({ cursor: i, updatedAt: new Date() });

    try {
      if (step.type === "ai.task") {
        await requireAiBudget(workspaceId);
        const tokensUsed = 800;
        await recordAiUsage({
          workspaceId,
          uid: null,
          kind: "workflow_step",
          tokens: tokensUsed,
          model: "gpt-5",
          entityType: getString(step.config, "entityType"),
          entityId: getString(step.config, "entityId"),
        });
      }

      if (step.type === "create.task") {
        await db.collection("tasks").add({
          workspaceId,
          title: getString(step.config, "title") || "Auto Task",
          description: getString(step.config, "description"),
          entityType: getString(step.config, "entityType"),
          entityId: getString(step.config, "entityId"),
          assignedToUid: getString(step.config, "assignedToUid"),
          priority: getString(step.config, "priority") || "normal",
          status: "todo",
          dueAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      // Add more step types as you wire them: send.docusign, create.invoice, notify, schedule.appointment
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      await runRef.update({
        status: "needs_review",
        error: { code: "STEP_FAILED", message },
        endedAt: new Date(),
        updatedAt: new Date(),
      });
      throw e;
    }
  }

  await runRef.update({ status: "succeeded", endedAt: new Date(), updatedAt: new Date() });
  return { runId: runRef.id };
}
