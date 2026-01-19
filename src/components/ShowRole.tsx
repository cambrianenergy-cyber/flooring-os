// src/components/ShowRole.tsx
"use client";
import { useUserRole } from "@/lib/useUserRole";
import { ROLE_LABELS } from "@/lib/roles";

export default function ShowRole() {
  const { role, loading } = useUserRole();
  if (loading) return null;
  if (!role) return <span className="text-xs text-gray-400">No role</span>;
  return <span className="text-xs font-semibold text-blue-700">{ROLE_LABELS[role]}</span>;
}
