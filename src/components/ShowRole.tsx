// src/components/ShowRole.tsx
"use client";
import { ROLE_LABELS } from "@/lib/roles";
import { useUserRole } from "@/lib/useUserRole";

export default function ShowRole() {
  const { role, loading } = useUserRole();
  if (loading) return null;
  if (!role) return <span className="text-xs text-muted">No role</span>;
  return (
    <span className="text-xs font-semibold text-blue-700">
      {ROLE_LABELS[role]}
    </span>
  );
}
