// src/lib/auditLogger.ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "message_send"
  | "message_receive"
  | "ai_agent_call"
  | string;

export interface AuditLogEntry {
  action: AuditAction;
  userId: string | null;
  userEmail: string | null;
  tenantId: string | null;
  details?: any;
  timestamp: number;
  createdAt?: any;
}

export async function logAudit(action: AuditAction, details?: any, tenantId?: string) {
  const user = auth.currentUser;
  const entry: AuditLogEntry = {
    action,
    userId: user?.uid || null,
    userEmail: user?.email || null,
    tenantId: tenantId || null,
    details,
    timestamp: Date.now(),
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, "auditLogs"), entry);
}
