import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { resolvePlan } from "@/lib/plans";

export function useWorkspacePlanStatus(workspaceId: string) {
  const [plan, setPlan] = useState<{ key: string; status: string; currentPeriodEnd: Date | null } | null>(null);
  useEffect(() => {
    if (!workspaceId) return;
    const ref = doc(db, "workspaces", workspaceId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      setPlan({
        key: data?.plan?.key || "start",
        status: data?.plan?.status || "inactive",
        currentPeriodEnd: data?.plan?.currentPeriodEnd ? new Date(data.plan.currentPeriodEnd.seconds * 1000) : null,
      });
    });
    return () => unsub();
  }, [workspaceId]);
  return plan;
}
