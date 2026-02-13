import { useEffect } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

// Listens to a workspace document by ID
export function useWorkspaceListener(workspaceId: string, onData: (data: any) => void) {
  useEffect(() => {
    if (!workspaceId) return;
    const db = getFirestore();
    const workspaceRef = doc(db, "workspaces", workspaceId);
    console.log("Workspace listener path:", workspaceRef.path);
    const unsubscribe = onSnapshot(workspaceRef, (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data());
      } else {
        onData(null);
      }
    });
    return () => unsubscribe();
  }, [workspaceId, onData]);
}
