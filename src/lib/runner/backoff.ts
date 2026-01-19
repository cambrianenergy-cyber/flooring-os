import { Timestamp } from "firebase-admin/firestore";

export function computeBackoffMs(baseDelayMs: number, attemptNumber: number) {
  // attemptNumber is 1-based (1,2,3...)
  const expo = Math.pow(2, Math.max(0, attemptNumber - 1)); // 1,2,4,8...
  const raw = baseDelayMs * expo;

  // jitter: +/- up to 25%
  const jitterFactor = 0.75 + Math.random() * 0.5;
  const jittered = Math.floor(raw * jitterFactor);

  // cap at 2 minutes (adjust as needed)
  const capped = Math.min(jittered, 120_000);
  return capped;
}

export function timestampFromNow(ms: number) {
  return Timestamp.fromMillis(Date.now() + ms);
}
