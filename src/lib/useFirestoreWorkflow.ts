import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  DocumentReference,
} from "firebase/firestore";
import { debugOnSnapshot } from "./debugOnSnapshot";
import type { WorkflowState } from "./workflow";

export function useFirestoreWorkflow(workspaceId: string) {
  const [state, setState] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !workspaceId) {
      setError("Not authenticated or workspaceId missing");
      setLoading(false);
      return;
    }
    const ref: DocumentReference = doc(db, "workspaces", workspaceId, "workflowStates", user.uid);
    const unsub = debugOnSnapshot(ref, "WORKFLOW_STATES_LISTENER", (snap: any) => {
      if (snap.exists()) {
        setState(snap.data() as WorkflowState);
      } else {
        setState(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [workspaceId]);

  const saveState = async (state: WorkflowState) => {
    const user = auth.currentUser;
    if (!user || !workspaceId) return;
    const ref: DocumentReference = doc(db, "workspaces", workspaceId, "workflowStates", user.uid);
    await setDoc(ref, state, { merge: true });
  };

  return { state, setState: saveState, loading, error };
}
