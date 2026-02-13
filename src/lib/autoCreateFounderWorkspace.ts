import { isFounder } from "@/lib/auth-utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

/**
 * Ensures a workspace exists for a founder user. If not, creates it.
 * Returns the workspaceId (user.uid).
 */
export async function autoCreateFounderWorkspace(user: {
  uid: string;
  email: string | null;
}) {
  if (!user?.uid || !user?.email || !isFounder(user.email)) {
    console.warn(
      "autoCreateFounderWorkspace: User missing uid/email or not founder",
      user,
    );
    return null;
  }
  const workspaceId = user.uid;
  const workspaceRef = doc(db, "workspaces", workspaceId);
  try {
    const workspaceSnap = await getDoc(workspaceRef);
    if (!workspaceSnap.exists()) {
      console.log(
        "autoCreateFounderWorkspace: Creating new workspace for founder",
        user.email,
        workspaceId,
      );
      await setDoc(workspaceRef, {
        founderUserId: user.uid,
        founderEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        plan: "essentials",
        status: "active",
        members: [user.email],
      });
    } else {
      console.log(
        "autoCreateFounderWorkspace: Workspace already exists for founder",
        user.email,
        workspaceId,
      );
    }
    return workspaceId;
  } catch (err) {
    console.error(
      "autoCreateFounderWorkspace: Error creating/fetching workspace",
      err,
      user,
    );
    return null;
  }
}
