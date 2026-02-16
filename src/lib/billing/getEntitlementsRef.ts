import { doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function entitlementsDocRef(workspaceId: string) {
  return doc(db, "workspaces", workspaceId, "entitlements", "current");
}
