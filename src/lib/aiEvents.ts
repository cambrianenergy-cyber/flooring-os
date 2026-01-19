import { db } from "@/lib/firebase";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import type { AIEvent } from "./types/aiEvent";

/**
 * Add a new AI event to Firestore (workspaces/{wid}/ai_events/{eventId})
 * @param workspaceId Workspace ID
 * @param eventId Event ID (use random or generated)
 * @param event Event data (see AIEvent interface)
 */
export async function addAIEvent(workspaceId: string, eventId: string, event: AIEvent) {
  const ref = doc(collection(db, `workspaces/${workspaceId}/ai_events`), eventId);
  // Convert createdAt to Firestore Timestamp if needed
  const data = {
    ...event,
    createdAt: event.createdAt instanceof Date ? Timestamp.fromDate(event.createdAt) : event.createdAt,
  };
  await setDoc(ref, data, { merge: false });
}
