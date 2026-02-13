# Billing & Upgrade Flow Documentation

## Maintainer Introduction

This guide explains the architecture, configuration, and best practices for managing billing and plan upgrades in Square Flooring OS. It is intended for engineers maintaining or extending the billing system.

---

## 1. Plan & Price Mapping

- All plan details and Stripe price IDs are centralized in `src/lib/stripe/plans.ts`.
- Update this file to add, remove, or change plans and their features.
- **Best Practice:** Keep plan keys and Stripe price IDs in sync. Document any changes in code comments and update UI components as needed.

## 2. Creating a Checkout Session

- The API route `src/app/api/stripe/create-checkout-session/route.ts` creates a Stripe Checkout session for a given workspace and plan.
- The session includes `metadata: { workspaceId, planId }` and `subscription_data: { metadata: { workspaceId, planId } }` for downstream mapping.
- On success, the user is redirected to Stripe Checkout, and then to `/billing/success` after payment.

## 3. Webhook Handling

- The API route `src/app/api/stripe/webhook/route.ts` processes Stripe events.
- It updates the Firestore `billing` collection and logs all changes to `billing_audit_logs`.
- The webhook uses the `workspaceId` and `planId` from Stripe metadata to map events to the correct workspace.
- **Audit Logging:** All billing/plan changes are logged for traceability and compliance.

## 4. Billing Summary & Management

- The billing summary page is at `/billing` (`src/app/billing/page.tsx`).
- Users can view their current plan, status, and manage their subscription via the "Manage Billing" button (Stripe portal).
- After a successful upgrade, users see a confirmation at `/billing/success`.

## 5. Adding a New Plan

1. Add the plan to `src/lib/stripe/plans.ts` with a unique key and Stripe price ID.
2. Update any UI components (e.g., UpgradeButton) if you want to display the new plan.
3. No backend changes are needed if you follow the PLANS config pattern.

## 6. Metadata Usage

- All Stripe sessions and subscriptions include `workspaceId` and `planId` in metadata for reliable mapping in webhooks.
- This ensures billing events are always associated with the correct workspace and plan.

## 7. Testing & Deployment

- API routes for billing and approval logic are covered by Jest tests (see `__tests__/route.test.ts` and `__tests__/approval.test.ts`).
- Mock external dependencies for isolated testing.
- **Deployment:** Always test billing flows in Stripe test mode before production deploys. Validate webhook event handling and audit logging.

## 8. Security & Audit

- Stripe secret keys are only used server-side.
- All billing/plan changes are logged in Firestore for auditability.
- **Best Practice:** Rotate Stripe keys periodically and restrict access to billing logs.

## 9. Troubleshooting & Extending

- If billing events are not mapped correctly, check Stripe metadata and webhook logs.
- For new features, extend the centralized plan config and update relevant UI/API routes.
- For further questions or to extend billing, see the code comments in the above files or contact the engineering team.

## Phase 2 Firestore Additions

The following Firestore collections are planned or recommended for Phase 2 of the platform. These support advanced workflows, integrations, and notifications:

- `estimate_approvals/{approvalId}`: Stores approval requests and statuses for estimates, enabling multi-step or manager approval flows.
- `integrations/{workspaceId_provider}`: Tracks third-party integration state per workspace and provider (e.g., DocuSign, QuickBooks).
- `envelopes/{envelopeId}`: Mirrors DocuSign envelope status and metadata for tracking document signature workflows.
- `notifications/{notificationId}` (optional but recommended): Centralizes user/system notifications for in-app and email delivery.

Document the schema and access patterns for each collection as they are implemented. Update this section as new collections are added.

## Firestore Composite Indexes

To support efficient queries for new and existing collections, add the following composite indexes to your firestore.indexes.json:

```
{
  "indexes": [
    {
      "collectionGroup": "estimate_approvals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requestedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "assignedToUserId", "order": "ASCENDING" },
        { "fieldPath": "startAt", "order": "ASCENDING" },
        { "fieldPath": "endAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- Place this configuration in firestore.indexes.json at the project root.
- These indexes enable efficient filtering and sorting for approval and appointment queries.
- Update this section as new indexes are required for additional collections or query patterns.

## Phase 2 Deployment Checklist

Before deploying Phase 2 features, ensure the following steps are completed:

- Add Stripe environment variables and webhook secret to your deployment environment.
- Deploy the Stripe webhook API route (`/api/stripe/webhook`).
- Deploy Firestore composite indexes (see firestore.indexes.json section above).
- Lock billing writes to server-only by tightening Firestore security rules.
- Add the approvals UI page for Founders/Managers.
- Wire the Estimate Intelligence panel into the estimate editor UI.
- Integrate DocuSign send functionality and webhook sync for envelope status.
- Smoke test all flows:
  - Paid/unpaid billing scenarios
  - Approval flow (estimate approvals)
  - Schedule conflict detection (appointments)

Update this checklist as new deployment or configuration steps are required for future phases.

---

_Last updated: January 25, 2026_
