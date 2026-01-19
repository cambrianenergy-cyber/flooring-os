import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { acquireRunLock, releaseRunLock } from "@/lib/runner/lock";
import { runNextStep } from "@/lib/runner/runNextStep";
import { hasFeature, type PlanKey } from "@/lib/plans";
import { resolvePlan } from "@/lib/plans";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs"; // IMPORTANT for firebase-admin

function requireCronKey(req: Request) {
  const key = req.headers.get("x-cron-key");
  if (!process.env.CRON_KEY) return; // allow if not set (dev)
  if (key !== process.env.CRON_KEY) throw new Error("Unauthorized");
}

export async function POST(req: Request) {
  try {
    requireCronKey(req);

    // Kill switch and env guard
    if (process.env.WORKFLOW_KILL_SWITCH === "true") {
      return NextResponse.json({ ok: false, error: "Workflows disabled" }, { status: 503 });
    }
    const env = process.env.APP_ENV || process.env.NODE_ENV || "dev";
    const requestEnv = req.headers.get("x-env") || env;
    if (requestEnv !== env) {
      return NextResponse.json({ ok: false, error: "Environment mismatch" }, { status: 403 });
    }

    // Plan gating (requires caller to send x-plan-key header)
    const planKey = (req.headers.get("x-plan-key") as PlanKey | null) ?? null;
    // Check if the plan allows workflow runs
    const plan = planKey ? resolvePlan(planKey) : null;
    if (!planKey || !plan || !plan.workflow?.enabled) {
      return NextResponse.json({ ok: false, error: "Plan does not allow workflows" }, { status: 403 });
    }

    // Rate limit by plan/workspace hint (if provided)
    const workspaceId = req.headers.get("x-workspace-id") || "unknown";
    const rl = await rateLimit(`workflow:${workspaceId}`, 60, 60_000); // 60 runs/min per workspace
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const runnerId = `runner-${process.env.VERCEL_REGION ?? "local"}-${Date.now()}`;
    const now = Timestamp.now();

    // Pull a small batch each tick (safe + prevents timeouts)
    const snap = await adminDb()
      .collection("workflow_runs")
      .where("status", "in", ["queued", "running"])
      .where("nextRunnableAt", "<=", now)
      .orderBy("nextRunnableAt", "asc")
      .limit(10)
      .get();

    const results: any[] = [];

    for (const doc of snap.docs) {
      const runId = doc.id;

      const lock = await acquireRunLock(runId, runnerId, 25_000);
      if (!lock.ok) {
        results.push({ runId, skipped: true, reason: lock.reason });
        continue;
      }

      try {
        // Optional: if run was "queued", set it to running on first tick
        const data = doc.data() as any;
        if (data.status === "queued") {
          await doc.ref.update({ status: "running", updatedAt: now });
        }

        const stepRes = await runNextStep(runId);
        results.push({ runId, ...stepRes });
      } finally {
        await releaseRunLock(runId, runnerId);
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 401 }
    );
  }
}
