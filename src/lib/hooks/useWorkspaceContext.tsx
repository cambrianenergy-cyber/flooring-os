"use client";
import { PlanId, resolveEntitlements } from "@/lib/entitlements";
import { auth, db } from "@/lib/firebase/client";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

type Billing = {
  planId: string;
  isActive: boolean;
};

type User = {
  isFounder?: boolean;
};

type WorkspaceContext = {
  userId: string;
  workspaceId: string;
  isFounder: boolean;
  billing: Billing | null;
  entitlements: ReturnType<typeof resolveEntitlements>;
};

export function useWorkspaceContext(): WorkspaceContext | null {
  const [ctx, setCtx] = useState<WorkspaceContext | null>(null);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    // You can replace this with your real "primaryWorkspaceId" logic
    const workspaceId =
      window.localStorage.getItem("sq_workspace_id") || "WORKSPACE_ID";

    const unsubUser = onSnapshot(doc(db, "users", u.uid), (userSnap) => {
      const user = userSnap.data() as User | undefined;
      const isFounder = !!user?.isFounder;

      const unsubBilling = onSnapshot(
        doc(db, "billing", workspaceId),
        (billSnap) => {
          const b: Billing = billSnap.exists()
            ? (billSnap.data() as Billing)
            : { planId: "free", isActive: false };
          const ent = resolveEntitlements({
            isFounder,
            isActive: !!b.isActive,
            planId: (b.planId ?? "free") as PlanId,
          });

          setCtx({
            userId: u.uid,
            workspaceId,
            isFounder,
            billing: {
              planId: (b.planId ?? "free") as PlanId,
              isActive: !!b.isActive,
            },
            entitlements: ent,
          });
        },
      );

      const unsubEntitlements = onSnapshot(
        doc(db, "workspaces", workspaceId, "entitlements", "main"),
        (entSnap) => {
          // If entitlements doc exists, merge with resolved entitlements
          const entData = entSnap.exists() ? entSnap.data() : {};
          setCtx((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              entitlements: {
                ...prev.entitlements,
                ...entData,
              },
            };
          });
        }
      );

      return () => {
        unsubBilling();
        unsubEntitlements();
      };
    });

    return () => unsubUser();
  }, []);

  return ctx;
}
