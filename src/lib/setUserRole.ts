// src/lib/setUserRole.ts
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserRole } from "@/lib/roles";

export async function setUserRole(uid: string, role: UserRole) {
  await setDoc(doc(db, "users", uid), { role }, { merge: true });
}
