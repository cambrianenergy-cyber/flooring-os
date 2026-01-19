# Data Lifecycle & Archiving Policy

## 1. Deleting Users
- When a user is deleted, their personal data is anonymized (GDPR-style), but references are retained for audit and historical records.
- The user is removed from all workspace memberships and all access tokens are revoked.
- A button in the admin UI should allow authorized users to execute this action.

## 2. Removing Members
- Removing a member from a workspace immediately revokes their access.
- Their historical actions remain in audit logs and job/estimate records.
- A button in the workspace/team management UI should allow authorized users to execute this action.

## 3. Keeping Audit Logs
- Audit logs are never deleted. They are stored indefinitely for legal protection and dispute resolution.
- Logs older than 2 years may be moved to cold storage (e.g., a separate Firestore collection or cloud storage bucket).
- No delete button is provided for audit logs.

## 4. Archiving Jobs (Not Delete)
- Jobs are never hard-deleted. Instead, they are marked as archived (e.g., `status: "archived"`).
- Archived jobs are hidden from active views but remain queryable for audits and disputes.
- A button in the jobs UI should allow authorized users to archive (and unarchive) jobs.

## 5. Versioning Estimates
- Once an estimate is sent to a customer, it is immutable. Any edits create a new version.
- All versions are stored with timestamps and author info for traceability.
- A button in the estimates UI should allow authorized users to view version history and create new versions.

---

## Implementation Notes
- All destructive or archival actions must be protected by role-based access control (RBAC).
- All actions should be logged in the audit log with user, timestamp, and action details.
- UI buttons for these actions must be visible only to users with the appropriate permissions.
- Actions should be confirmed with a dialog before execution.
