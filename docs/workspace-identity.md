// Workspace identity propagation best practices
// Place this in your docs or as a code comment for all workspace-owned Firestore documents

/**
 * Workspace-owned document schema (example for any collection):
 * {
 *   ...otherFields,
 *   workspaceId: string,      // REQUIRED: The workspace this doc belongs to
 *   createdAt: Timestamp,     // REQUIRED: Firestore serverTimestamp
 *   updatedAt: Timestamp      // REQUIRED: Firestore serverTimestamp
 * }
 *
 * Example usage in Firestore set/add:
 * await setDoc(doc(db, 'jobs', jobId), {
 *   ...jobData,
 *   workspaceId,
 *   createdAt: serverTimestamp(),
 *   updatedAt: serverTimestamp(),
 * });
 *
 * Firestore security rules:
 * - Require workspaceId field on all workspace-owned docs
 * - Use workspaceId in queries and rules for access control
 */

// Add this pattern to all workspace-owned collections: jobs, leads, appointments, etc.
