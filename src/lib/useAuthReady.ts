import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Hook to ensure Firebase auth state is loaded before rendering onboarding logic.
 * Returns true when auth is ready (user is loaded, even if null).
 */
export function useAuthReady() {
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
    return () => unsub();
  }, []);
  return authReady;
}
