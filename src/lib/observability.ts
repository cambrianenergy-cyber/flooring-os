import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
// Server-only code removed for static export
// import { adminDb } from "@/lib/firebaseAdmin";
const adminDb = {};
import { AgentLog, WorkflowFailure } from "@/lib/types";

// Centralized helpers to record failures and audit events.
// Intended for server-side use; callers must supply workspaceId to enforce tenant boundaries.

export async function logAgentFailure(input: AgentLog, store: any = adminDb ?? db) {
  await addDoc(collection(store, "agent_logs"), sanitizeTimestamps(input));
}

export async function logWorkflowFailure(input: WorkflowFailure, store: any = adminDb ?? db) {
  await addDoc(collection(store, "workflow_failures"), sanitizeTimestamps(input));
}

export async function logAuditEvent(event: {
  workspaceId: string;
  actorType: "system" | "user" | "agent";
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: any;
  createdAt?: number;
}, store: any = adminDb ?? db) {
  const payload = {
    ...event,
    createdAt: event.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  await addDoc(collection(store, "audit_logs"), payload);
}

function sanitizeTimestamps<T extends { createdAt?: any; updatedAt?: any }>(doc: T): T {
  const now = Date.now();
  return {
    ...doc,
    createdAt: doc.createdAt ?? now,
    updatedAt: doc.updatedAt ?? now,
  };
}
