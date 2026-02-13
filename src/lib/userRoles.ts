export type UserRole = "founder" | "owner" | "admin" | "member" | "viewer";

export function isFounder(role?: UserRole) {
  return role === "founder";
}
