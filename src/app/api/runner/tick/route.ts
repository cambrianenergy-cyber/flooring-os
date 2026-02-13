import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { acquireRunLock, releaseRunLock } from "@/lib/runner/lock";
import { runNextStep } from "@/lib/runner/runOneStep";

export const runtime = "nodejs";

interface WorkflowRunData {
  status: "queued" | "running" | "completed" | "failed";
  [key: string]: unknown;
}

interface TickResult {
  runId: string;
  skipped?: boolean;
  reason?: string;
  [key: string]: unknown;
}

function requireCronKey(req: Request) {
  const key = req.headers.get("x-cron-key");
  if (!process.env.CRON_KEY) return; // allow in dev if not set
  if (key !== process.env.CRON_KEY) throw new Error("Unauthorized");
}

export async function POST(req: Request) {
  try {
    requireCronKey(req);

    const runnerId = `runner-${process.env.VERCEL_REGION ?? "local"}-${Date.now()}`;
    const now = Timestamp.now();

    const snap = await adminDb()
      .collection("workflow_runs")
      .where("status", "in", ["queued", "running"])
      .where("nextRunnableAt", "<=", now)
      .orderBy("nextRunnableAt", "asc")
      .limit(10)
      .get();

    const results: TickResult[] = [];

    for (const doc of snap.docs) {
      const runId = doc.id;

      const lock = await acquireRunLock(runId, runnerId, 25_000);
      if (!lock.ok) {
        results.push({ runId, skipped: true, reason: lock.reason });
        continue;
      }

      try {
        const data = doc.data() as WorkflowRunData;
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
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 401 }
    );
  }
}
