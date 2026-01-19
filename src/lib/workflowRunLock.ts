import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export async function acquireRunLock(runId: string, runnerId: string, lockMs = 25_000) {
  const runRef = adminDb().collection("workflow_runs").doc(runId);

  return await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(runRef);
    if (!snap.exists) return { ok: false as const, reason: "not_found" as const };

    const run = snap.data() as any;

    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(Date.now() + lockMs);

    const currentLock = run.lock;
    if (currentLock?.expiresAt?.toMillis?.() > Date.now()) {
      return { ok: false as const, reason: "locked" as const };
    }

    tx.update(runRef, {
      lock: { by: runnerId, at: now, expiresAt },
      updatedAt: now,
    });

    return { ok: true as const };
  });
}

export async function releaseRunLock(runId: string, runnerId: string) {
  const runRef = adminDb().collection("workflow_runs").doc(runId);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(runRef);
    if (!snap.exists) return;

    const run = snap.data() as any;
    if (run.lock?.by !== runnerId) return;

    tx.update(runRef, { lock: null, updatedAt: Timestamp.now() });
  });
}
