// src/lib/withRolePermission.ts
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { hasPermission, UserRole } from "@/lib/roles";

/**
 * Checks if a user has the required permission for backend/server logic.
 * Throws an error if not permitted.
 * @param uid Firebase Auth UID
 * @param permission Permission string (e.g. 'settings', 'jobs', etc)
 */
export async function requirePermission(uid: string, permission: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User not found");
  const role = snap.data().role as UserRole | undefined;
  if (!role || !hasPermission(role, permission)) {
    throw new Error("Permission denied");
  }
  return true;
}

// Usage in API route or server function:
// await requirePermission(uid, 'settings');
// ...proceed with logic...
