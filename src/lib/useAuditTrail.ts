// useAuditTrail.ts
// Utility to log audit/history events to Firestore

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  data
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  data?: any;
}) {
  await addDoc(collection(db, "auditTrail"), {
    userId,
    action,
    entityType,
    entityId,
    data,
    timestamp: serverTimestamp(),
  });
}
