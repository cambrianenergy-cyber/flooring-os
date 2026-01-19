// src/components/RoleGuard.tsx
"use client";
import { ReactNode } from "react";
import { useUserRole } from "@/lib/useUserRole";
import { hasPermission } from "@/lib/roles";

interface RoleGuardProps {
  required?: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ required, children, fallback = null }: RoleGuardProps) {
  const { role, loading } = useUserRole();

  if (loading) return null;
  if (!role) return fallback;

  if (!required) return <>{children}</>;
  const requiredArr = Array.isArray(required) ? required : [required];
  if (requiredArr.some((perm) => hasPermission(role, perm))) {
    return <>{children}</>;
  }
  return fallback;
}
