// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";
type Transaction = { get: (ref: unknown) => Promise<{ exists: boolean; data: () => unknown }>, set: (ref: unknown, data: unknown) => void, update: (ref: unknown, data: unknown) => void };
const adminDb = () => ({
  collection: (..._args: unknown[]) => {
    void _args;
    return {
      doc: (..._docArgs: unknown[]) => { void _docArgs; return { get: async () => ({ exists: false, data: () => ({}) }), set: async () => {}, update: async () => {} }; }
    };
  },
  runTransaction: async (fn: (tx: Transaction) => Promise<RateLimitResult>) => await fn({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => {}, update: async () => {} })
});

type RateLimitResult = { allowed: boolean; remaining: number; reset: number; backend: "firestore" | "memory" };

const buckets = new Map<string, { count: number; reset: number }>();

async function rateLimitMemory(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, reset: now + windowMs, backend: "memory" };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, reset: bucket.reset, backend: "memory" };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, reset: bucket.reset, backend: "memory" };
}

async function rateLimitFirestore(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const reset = now + windowMs;
  const ref = adminDb().collection("rate_limits").doc(key);

  try {
    const result = await adminDb().runTransaction(async (tx: Transaction) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() as { count?: number; reset?: number }) : {};
      const count = data.count ?? 0;
      const currentReset = data.reset ?? 0;

      if (!snap.exists || currentReset < now) {
        tx.set(ref, { count: 1, reset, updatedAt: now });
        return { allowed: true, remaining: limit - 1, reset, backend: "firestore" } as RateLimitResult;
      }

      if (count >= limit) {
        return { allowed: false, remaining: 0, reset: currentReset, backend: "firestore" } as RateLimitResult;
      }

      tx.update(ref, { count: count + 1, updatedAt: now });
      return { allowed: true, remaining: limit - (count + 1), reset: currentReset, backend: "firestore" } as RateLimitResult;
    });

    return result;
  } catch {
    // Fallback to memory if Firestore fails
    return rateLimitMemory(key, limit, windowMs);
  }
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const backend = process.env.RATE_LIMIT_BACKEND ?? "firestore";
  if (backend === "firestore") {
    return rateLimitFirestore(key, limit, windowMs);
  }
  return rateLimitMemory(key, limit, windowMs);
}
