// Server-only code removed for static export
// import { adminDb } from "./firebaseAdmin";
const adminDb = () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }) }) }) });

export type Role = "owner" | "admin" | "sales" | "installer" | "viewer";

export async function requireWorkspaceMember(workspaceId: string, uid: string) {
  // Static export stub: always throws
  throw new Error("NOT_MEMBER (static export stub)");
}

export function requireRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) throw new Error("FORBIDDEN");
}
