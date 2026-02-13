import { isFounder } from "@/lib/auth-utils";
import { getSessionUser } from "@/lib/sessionUser";
import { redirect } from "next/navigation";

export async function requireWorkspace() {
  const user = await getSessionUser();
  if (!user || !user.workspaceId) redirect("/login");
  return user;
}

export async function requireFounder() {
  const user = await requireWorkspace();
  if (!isFounder(user.role)) redirect("/dashboard");
  return user;
}
