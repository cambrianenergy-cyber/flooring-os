// Helper: safeOnSnapshot for debugging permission errors
import { onSnapshot } from 'firebase/firestore';

export function safeOnSnapshot(ref, label, cb, err) {
  return onSnapshot(
    ref,
    (snap) => cb(snap),
    (e) => {
      console.error(`[snapshot denied] ${label}`, {
        message: e?.message,
        code: e?.code,
        ref: ref?.path ?? ref?.toString?.(),
      });
      err?.(e);
    }
  );
}

// Example usage in your client code:
// safeOnSnapshot(q, 'LEADS_LISTENER', (snap) => { ... });
// Replace onSnapshot(q, ...) with safeOnSnapshot(q, 'LABEL', ...)
