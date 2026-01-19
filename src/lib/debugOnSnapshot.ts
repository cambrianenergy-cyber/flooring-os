import { onSnapshot } from "firebase/firestore";

export function debugOnSnapshot(ref: any, label: string, onData: any) {
  return onSnapshot(
    ref,
    onData,
    (e: unknown) => {
      console.error(`[permission-denied] ${label}`, {
        code: (e as any)?.code,
        message: (e as any)?.message,
        path: ref?.path ?? ref?.toString?.(),
      });
    }
  );
}
