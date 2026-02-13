import { adminDb } from "@/lib/firebaseAdmin";

export async function acquireRunLock(
  runId: string,
  runnerId: string,
  ttlMs = 25000,
) {
  const runRef = adminDb().collection("workflow_runs").doc(runId);
  const now = Date.now();
  const expiresAt = now + ttlMs;

  try {
    const res = await adminDb().runTransaction(async (txn) => {
      const doc = await txn.get(runRef);
      if (!doc.exists) return { ok: false, reason: "not_found" };

      const data = doc.data();
      if (
        data &&
        data.lock &&
        data.lock.expiresAt > now &&
        data.lock.by !== runnerId
      ) {
        return { ok: false, reason: "locked" };
      }

      txn.update(runRef, {
        lock: { by: runnerId, at: now, expiresAt },
      });
      return { ok: true };
    });
    return res;
  } catch (_) {
    return { ok: false, reason: "error" };
  }
}

export async function releaseRunLock(runId: string, runnerId: string) {
  const runRef = adminDb().collection("workflow_runs").doc(runId);
  try {
    await adminDb().runTransaction(async (txn) => {
      const doc = await txn.get(runRef);
      if (!doc.exists) return;
      const data = doc.data();
      if (data && data.lock && data.lock.by === runnerId) {
        txn.update(runRef, { lock: null });
      }
    });
    return { ok: true };
  } catch (_) {
    return { ok: false };
  }
}
