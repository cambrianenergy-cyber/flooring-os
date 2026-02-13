/* =========================================================
   Founder Dashboard — Exact Hook Interfaces + Firestore Queries
   Target stack: Next.js (App Router or Pages), React, Firebase v9+
   Assumes: you have `db` (Firestore) + `auth` and a current `uid`.
   ========================================================= */

/* =========================================================
   Related Firestore Schemas / Collections (required for hooks)
   ========================================================= */

/**
 * These hooks assume these collections exist and have the referenced fields:
 *
 * users/{uid}:
 *   - isFounder: boolean
 *   - defaultWorkspaceId?: string
 *
 * founder/{founderId}/globalSnapshots/{snapshotId}:
 *   - createdAt: Timestamp
 *   - KPIs: (see GlobalSnapshot type)
 *
 * founder/{founderId}/metricsDaily/{dateId}:
 *   - dateId: string (YYYY-MM-DD)
 *   - metrics fields: (see MetricsDaily type)
 *
 * founder/{founderId}/workspaceSnapshots/{workspaceId}:
 *   - updatedAt: Timestamp
 *   - health: string
 *   - industry: string
 *   - billingStatus: string
 *   - planId: string
 *   - ...etc (see WorkspaceSnapshot type)
 *
 * founder/{founderId}/billingIssues/{workspaceId}:
 *   - updatedAt: Timestamp
 *   - workspaceId: string
 *   - ...etc (see BillingIssue type)
 *
 * founder/{founderId}/docusignQueue/{contractId}:
 *   - stuckDays: number
 *   - updatedAt: Timestamp
 *   - workspaceId: string
 *   - status: string
 *   - ...etc (see DocusignQueueItem type)
 *
 * founder/{founderId}/systemIssues/{issueId}:
 *   - status: string
 *   - severityRank: number
 *   - lastSeenAt: Timestamp
 *   - workspaceId?: string
 *   - type: string
 *   - ...etc (see SystemIssue type)
 */

/* =========================================================
   Firestore Schema Examples & Security Rules (reference)
   ========================================================= */

/**
 * Example Firestore document shapes:
 *
 * users/{uid}:
 *   {
 *     isFounder: boolean,
 *     defaultWorkspaceId?: string
 *   }
 *
 * founder/{founderId}/globalSnapshots/{snapshotId}:
 *   {
 *     createdAt: Timestamp,
 *     ...KPIs (see GlobalSnapshot type)
 *   }
 *
 * founder/{founderId}/metricsDaily/{dateId}:
 *   {
 *     dateId: string, // YYYY-MM-DD
 *     ...metrics fields (see MetricsDaily type)
 *   }
 *
 * founder/{founderId}/workspaceSnapshots/{workspaceId}:
 *   {
 *     updatedAt: Timestamp,
 *     health: string,
 *     industry: string,
 *     billingStatus: string,
 *     planId: string,
 *     ...etc (see WorkspaceSnapshot type)
 *   }
 *
 * founder/{founderId}/billingIssues/{workspaceId}:
 *   {
 *     updatedAt: Timestamp,
 *     workspaceId: string,
 *     ...etc (see BillingIssue type)
 *   }
 *
 * founder/{founderId}/docusignQueue/{contractId}:
 *   {
 *     stuckDays: number,
 *     updatedAt: Timestamp,
 *     workspaceId: string,
 *     status: string,
 *     ...etc (see DocusignQueueItem type)
 *   }
 *
 * founder/{founderId}/systemIssues/{issueId}:
 *   {
 *     status: string,
 *     severityRank: number,
 *     lastSeenAt: Timestamp,
 *     workspaceId?: string,
 *     type: string,
 *     ...etc (see SystemIssue type)
 *   }
 */

/**
 * Example Firestore security rules (reference):
 *
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     // Users: allow user to read/write their own profile
 *     match /users/{uid} {
 *       allow read, write: if request.auth != null && request.auth.uid == uid;
 *     }
 *
 *     // Founder collections: read-only for clients, writes only via server
 *     match /founder/{founderId}/{coll}/{docId} {
 *       allow read: if request.auth != null && request.auth.uid == founderId;
 *       allow write: if false; // Only server can write
 *     }
 *
 *     // Optionally, allow server-side writes via custom claims or service account
 *     // ...
 *   }
 * }
 */

/**
 * Example Firestore security rules for workspace drilldown collections:
 *
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     // Allow workspace members to read estimates, contracts, appointments
 *     match /workspaces/{workspaceId}/{coll}/{docId} {
 *       allow read: if request.auth != null && isWorkspaceMember(workspaceId);
 *       allow write: if false; // Only server or privileged users can write
 *     }
 *
 *     // Helper function (define in rules):
 *     function isWorkspaceMember(workspaceId) {
 *       // Example: check if user is in workspace's members subcollection or has claim
 *       return exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));
 *     }
 *   }
 * }
 */

/* =========================================================
   Required Firestore Indexes (for these hooks)
   ========================================================= */

/**
 * You must create these composite indexes in Firestore for correct query performance:
 *
 * Founder collections:
 *
 * 1. founder/{founderId}/globalSnapshots: order by createdAt desc
 * 2. founder/{founderId}/metricsDaily: order by dateId asc (with range filtering)
 * 3. founder/{founderId}/workspaceSnapshots:
 *      - order by updatedAt desc
 *      - industry + updatedAt desc
 *      - health + updatedAt desc
 *      - billingStatus + updatedAt desc
 *      - planId + updatedAt desc
 *      - mrrCents desc
 *      - wins30d desc
 * 4. founder/{founderId}/billingIssues:
 *      - order by updatedAt desc
 *      - workspaceId + updatedAt desc
 * 5. founder/{founderId}/docusignQueue:
 *      - stuckDays desc + updatedAt desc
 *      - workspaceId + stuckDays desc
 * 6. founder/{founderId}/systemIssues:
 *      - status + severityRank desc + lastSeenAt desc
 *      - workspaceId + status + severityRank desc
 *
 * Drilldown live reads (optional):
 *
 * 7. workspaces/{workspaceId}/appointments:
 *      - scheduledStartAt asc (with where scheduledStartAt >= now)
 * 8. workspaces/{workspaceId}/estimates:
 *      - createdAt desc
 * 9. workspaces/{workspaceId}/contracts:
 *      - createdAt desc
 *
 * See Firestore console > Indexes for how to add these. If you use the CLI, add to firestore.indexes.json.
 */

/* =========================================================
   Optional: Single-workspace live collections (drilldown)
   ========================================================= */

/**
 * workspaces/{workspaceId}/estimates
 *   - createdAt: Timestamp
 *   - ...fields as needed for estimates
 *
 * workspaces/{workspaceId}/contracts
 *   - createdAt: Timestamp
 *   - ...fields as needed for contracts
 *
 * workspaces/{workspaceId}/appointments
 *   - scheduledStartAt: Timestamp
 *   - ...fields as needed for appointments
 */
