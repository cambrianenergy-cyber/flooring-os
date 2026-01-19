import { serverTimestamp } from "firebase/firestore";

/**
 * Attach workspace identity and timestamps to a new document.
 * @param workspaceId - The workspace this doc belongs to
 * @param data - The document data
 */
export function withWorkspace(workspaceId: string, data: Record<string, any>) {
  return {
    ...data,
    workspaceId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Attach updatedAt timestamp to an update operation.
 * @param data - The document data to update
 */
export function withUpdate(data: Record<string, any>) {
  return {
    ...data,
    updatedAt: serverTimestamp(),
  };
}
