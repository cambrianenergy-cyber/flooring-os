"use client";
import { ReactNode } from "react";

export function PaywallGate({
  allow,
  fallback,
  children,
}: {
  allow: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  if (allow) return <>{children}</>;
  return (
    <>
      {fallback ?? (
        <div
          style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Upgrade required
          </div>
          <div style={{ opacity: 0.8 }}>
            This feature is locked for your plan.
          </div>
        </div>
      )}
    </>
  );
}
