import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { validateWorkspaceMember } from "./onboarding";

export function useWorkspaceMembership(workspaceId: string) {
  const [membership, setMembership] = useState<null | { status: string; role: string }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembership() {
      setLoading(true);
      setError(null);
      const user = auth.currentUser;
      if (!user || !workspaceId) {
        setMembership(null);
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, "workspace_members", `${workspaceId}_${user.uid}`);
        const snap = await getDoc(ref);
        if (snap.exists() && validateWorkspaceMember(snap.data())) {
          setMembership({
            status: snap.data().status,
            role: snap.data().role,
          });
        } else {
          setMembership(null);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load membership");
        setMembership(null);
      }
      setLoading(false);
    }
    fetchMembership();
  }, [workspaceId]);

  return { membership, loading, error };
}
