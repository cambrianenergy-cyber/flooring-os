import { isFounder } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

// Accept user/session info as a parameter
export function requireWorkspace(user: { workspaceId?: string }) {
  if (!user || !user.workspaceId) redirect("/login");
  return user;
}

export function requireFounder(user: { role?: string, workspaceId?: string }) {
  if (!user || !user.workspaceId) redirect("/login");
  if (!isFounder(user.role)) redirect("/dashboard");
  return user;
}
