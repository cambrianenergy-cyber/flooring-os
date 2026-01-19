# Flooring OS – Admin Tools & Overrides

## Overview
This document describes the new admin/founder override features, permission model, and onboarding improvements for the Flooring OS platform.

---

## Admin & Founder Tools

### Who Can Use These Tools?
- **Founders**: Full access to all override tools.
- **Owners/Admins**: Access to most override tools (except force-reset password, which is founder-only).
- **Other Roles**: No access; see permission denial messaging.

### Tools & Features

#### 1. Force-Invite User
- **Purpose**: Invite any user to a workspace, bypassing normal invite flow.
- **Access**: Owner, Admin, Founder
- **Location**: AdminOverridePanel (Dashboard > Admin/Founder Overrides)
- **Audit Logging**: All actions are logged.

#### 2. Reset AI/Workflow Quota
- **Purpose**: Instantly reset AI and workflow usage counters for a workspace.
- **Access**: Owner, Admin, Founder
- **Location**: AdminOverridePanel
- **Audit Logging**: All actions are logged.

#### 3. Unlock Feature
- **Purpose**: Enable a feature flag for a workspace (e.g., early access, support unlocks).
- **Access**: Owner, Admin, Founder
- **Location**: AdminOverridePanel
- **Audit Logging**: All actions are logged.

#### 4. Force-Reset User Password
- **Purpose**: Founders can reset any user's password (for support or security).
- **Access**: Founder only
- **Location**: FounderForceResetPassword (visible on founder dashboard)
- **Audit Logging**: All actions are logged.

---

## Error Handling & Notifications
- All critical actions use toast notifications for success/failure.
- Permission denial is clearly messaged everywhere a user might lack access.
- Global error boundaries catch and display unexpected errors.

---

## User Onboarding
- New users are guided through onboarding with clear empty states and next steps.
- Empty-state education is present for Jobs, Estimates, Invoices, and Reviews.
- Sidebar and dashboard provide quick access to all major flows.

---

## Testing & QA
- All override actions are protected by strict permission checks (backend and UI).
- Audit logs are written for every override action.
- End-to-end tests should cover all override flows, error cases, and permission boundaries.

---

## How to Use
1. Log in as a founder, owner, or admin.
2. Navigate to the dashboard.
3. Use the Admin/Founder Overrides panel for invites, quota resets, and feature unlocks.
4. Founders see an additional tool for force-resetting user passwords.
5. All actions provide instant feedback and are logged for auditing.

---

## Support
For questions or issues, contact the platform admin or see the audit log for recent override actions.
