import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserRole } from "./auth/roles";

export type SessionUser = {
  uid: string;
  email: string;
  role: UserRole;
  workspaceId: string;
  displayName?: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const user = auth.currentUser;
  if (!user) return null;

  // Fetch user profile from Firestore (assuming /users/{uid} doc exists)
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return null;
  const data = userDoc.data();

  return {
    uid: user.uid,
    email: user.email || "",
    role: data.role || "user",
    workspaceId: data.workspaceId || "",
    displayName: user.displayName || data.displayName || "",
  };
}
