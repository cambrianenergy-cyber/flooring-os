"use client";
import { useWorkspaceContext } from "@/lib/hooks/useWorkspaceContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RequirePaid({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ctx = useWorkspaceContext();

  useEffect(() => {
    if (!ctx) return;
    if (ctx.isFounder) return;
    if (!ctx.billing?.isActive) router.replace("/billing");
  }, [ctx, router]);

  if (!ctx) return <div>Loading…</div>;
  if (!ctx.isFounder && !ctx.billing?.isActive)
    return <div>Redirecting to billing…</div>;
  return <>{children}</>;
}
