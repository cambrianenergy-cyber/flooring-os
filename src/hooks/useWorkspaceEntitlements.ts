"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { entitlementsDocRef } from "@/lib/billing/getEntitlementsRef";

export function useWorkspaceEntitlements(workspaceId?: string) {
  const [entitlements, setEntitlements] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!workspaceId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      setEntitlements(null);
      return;
    }

    setLoading(true);
    const ref = entitlementsDocRef(workspaceId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setEntitlements(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        setError(err?.message ?? "Failed to load entitlements");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [workspaceId]);

  const planId = useMemo(() => entitlements?.planId ?? "free", [entitlements]);

  return { entitlements, planId, loading, error };
}
