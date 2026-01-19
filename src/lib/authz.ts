import { adminDb } from "./firebaseAdmin";

export type Role = "owner" | "admin" | "sales" | "installer" | "viewer";

export async function requireWorkspaceMember(workspaceId: string, uid: string) {
  const db = adminDb();
  const id = `${workspaceId}_${uid}`;
  const snap = await db.collection("workspace_members").doc(id).get();
  if (!snap.exists) throw new Error("NOT_MEMBER");
  const data = snap.data()!;
  if (data.status !== "active") throw new Error("MEMBER_INACTIVE");
  return data as { role: Role; status: string; workspaceId: string; uid: string };
}

export function requireRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) throw new Error("FORBIDDEN");
}
