// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";

interface WorkflowRunLock {
  by: string;
  at: number;
  expiresAt: number;
}

interface DocumentSnapshot {
  exists: boolean;
  data: () => Record<string, unknown>;
}

interface Transaction {
  get: (ref: DocumentRef) => Promise<DocumentSnapshot>;
  update: (ref: DocumentRef, data: Record<string, unknown>) => Promise<void>;
}

type DocumentRef = unknown;

const adminDb = () => {
  return {
    collection: (...args: unknown[]) => {
      void args;
      return {
        doc: (...docArgs: unknown[]) => {
          void docArgs;
          return {
            get: async () => ({ exists: false, data: () => ({}) }),
            update: async () => {},
            id: '',
          };
        },
        add: async () => ({}),
        where: () => ({
          get: async () => ({ size: 0, docs: [] })
        })
      };
    },
    runTransaction: async (fn: (txn: Transaction) => Promise<unknown>) => {
      return await fn({
        get: async () => ({ exists: false, data: () => ({}) }),
        update: async () => {},
      });
    }
  };
};

export async function acquireRunLock(
  runId: string,
  runnerId: string,
  ttlMs = 25000,
) {
  const runRef = adminDb().collection("workflow_runs").doc(runId);
  const now = Date.now();
  const expiresAt = now + ttlMs;

  try {
    const res = await adminDb().runTransaction(async (txn: Transaction) => {
      const doc = await txn.get(runRef);
      if (!doc.exists) return { ok: false, reason: "not_found" };

      const data = doc.data();
      const lock = data && data.lock as WorkflowRunLock | undefined;
      if (
        lock &&
        lock.expiresAt > now &&
        lock.by !== runnerId
      ) {
        return { ok: false, reason: "locked" };
      }

      txn.update(runRef, {
        lock: { by: runnerId, at: now, expiresAt },
      });
      return { ok: true };
    });
    return res;
  } catch {
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
      const lock = data && data.lock as WorkflowRunLock | undefined;
      if (lock && lock.by === runnerId) {
        txn.update(runRef, { lock: null });
      }
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
