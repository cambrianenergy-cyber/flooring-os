// Firestore data model documentation for workspaces, members, invites, and users

/\*\*

- GLOBAL CONVENTIONS (APPLY TO ALL COLLECTIONS)
- - createdAt: timestamp
- - updatedAt: timestamp
- - workspaceId: string (for workspace-scoped docs)
- - ownerUserId: string (where relevant)
- - isDeleted: boolean (soft delete)
- - deletedAt: timestamp | null (soft delete timestamp)
- - amountCents: number (for money, never float)
- - <fieldName>Normalized: string (lowercased for search/sort)
    \*/

/\*\*

- Collection: workspaces/{workspaceId}
- Fields:
- - name: string
- - nameNormalized: string
- - slug: string
- - ownerUserId: string
- - timezone: string
- - status: "active" | "inactive" | "archived"
- - branding: map
- - settings: map
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: agent_types/{typeId}
- Purpose: Master list of agent templates (global catalog).
- Fields:
- - type: string (unique key, e.g., estimator_agent)
- - name: string
- - nameNormalized: string
- - category: "sales" | "ops" | "estimating" | "install" | "admin" | "marketing"
- - description: string
- - defaultModel: string
- - defaultTools: string[] (e.g., firestore_read, firestore_write, pdf_generate)
- - defaultPrompt: string
- - inputSchema: object (json-like, lightweight)
- - outputSchema: object
- - isActive: boolean
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: agent_instances/{agentInstanceId}
- Purpose: What a workspace actually has enabled.
- Fields:
- - workspaceId: string
- - agentType: string (ref agent_types.type)
- - name: string (custom display name)
- - nameNormalized: string
- - status: "enabled" | "disabled" | "paused"
- - config: { temperature: number, maxTokens: number, tone: string, allowedCollections: string[] }
- - guardrails: { canSendSms: boolean, canEmail: boolean, canCreateEstimates: boolean, canEditPrices: boolean, requiresApprovalFor: string[] }
- - ownerUserId: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: agent_permissions/{permissionId}
- Purpose: Enforced scopes by agent instance (not just in prompt).
- Fields:
- - workspaceId: string
- - agentInstanceId: string
- - scopes: string[] (examples: read:leads, write:estimates, read:jobs, write:tasks)
- - fieldRestrictions: { [collection: string]: { denyWriteFields: string[], allowWriteFields: string[] } }
- - requiresHumanApproval: string[] (actions)
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: agent_queues/{queueId}
- Purpose: Task queue for orchestrator (required).
- Fields:
- - workspaceId: string
- - agentInstanceId: string
- - jobType: string (e.g., lead_followup, estimate_draft, doc_generate, status_update)
- - priority: number (1–10)
- - payload: object
- - status: "queued" | "locked" | "running" | "succeeded" | "failed" | "canceled"
- - scheduledAt: timestamp
- - lockedAt: timestamp | null
- - lockedBy: string | null
- - attempts: number
- - maxAttempts: number
- - lastError: { code: string, message: string } | null
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: agent_runs/{runId}
- Purpose: Every run is auditable.
- Fields:
- - workspaceId: string
- - agentInstanceId: string
- - source: "workflow" | "manual" | "system" | "webhook"
- - sourceRef: { type: string, id: string }
- - input: object
- - output: object | null
- - status: "running" | "succeeded" | "failed" | "canceled"
- - timing: { startedAt: timestamp, endedAt: timestamp | null, durationMs: number | null }
- - usage: { promptTokens: number, completionTokens: number, totalTokens: number, costUsd: number }
- - error: { code: string, message: string, stack: string | null } | null
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: agent_run_steps/{stepId}
- Purpose: Debugging and trust.
- Fields:
- - workspaceId: string
- - agentRunId: string
- - order: number
- - type: "thought" | "tool_call" | "tool_result" | "decision" | "output"
- - name: string
- - data: object
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
    \*/

/\*\*

- Collection: agent_memory/{memoryId}
- Purpose: Safe, scoped memory.
- Fields:
- - workspaceId: string
- - scope: "workspace" | "lead" | "contact" | "job" | "estimate"
- - scopeId: string
- - summary: string
- - facts: string[]
- - lastRefreshedAt: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: prompt_templates/{templateId}
- Purpose: Version control prompts like code.
- Fields:
- - workspaceId: string | null (null = global default)
- - key: string (e.g., estimator_agent_v1)
- - version: number
- - prompt: string
- - notes: string
- - isActive: boolean
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - createdBy: string
    \*/

/\*\*

- Collection: entitlements/{entitlementId}
- Purpose: The single source of truth for what a workspace can do.
- Fields:
- - workspaceId: string
- - planCode: string (matches plans.code)
- - status: "active" | "past_due" | "canceled" | "trialing" | "paused"
- - limits: { seats: number, agents: number, workflows: number, runsPerMonth: number, documentsPerMonth: number }
- - features: { [flag: string]: boolean } (e.g., aiAgents, workflowAutomation, sms, email, eSign, providerIntegrations, advancedAnalytics)
- - period: { start: timestamp, end: timestamp }
- - trialEndsAt: timestamp | null
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: billing_customers/{customerId}
- Purpose: Billing customer mapping for a workspace.
- Fields:
- - workspaceId: string
- - stripeCustomerId: string
- - email: string
- - emailNormalized: string
- - name: string | null
- - nameNormalized: string
- - billingStatus: "ok" | "needs_payment_method" | "past_due" | "canceled"
- - defaultPaymentMethodLast4: string | null
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: billing_subscriptions/{subscriptionId}
- Purpose: Workspace subscription state.
- Fields:
- - workspaceId: string
- - stripeSubscriptionId: string
- - planCode: string
- - stripePriceId: string
- - status: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "paused"
- - cancelAtPeriodEnd: boolean
- - currentPeriodStart: timestamp
- - currentPeriodEnd: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: usage_counters/{counterId}
- Purpose: Hard-enforcement counters (resets monthly).
- Fields:
- - workspaceId: string
- - periodKey: string (format: YYYY-MM, e.g., 2026-01)
- - seatsUsed: number
- - agentsEnabled: number
- - workflowRuns: number
- - agentRuns: number
- - documentsGenerated: number
- - storageBytes: number
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: plans/{planId}
- Purpose: Global plan catalog (not per workspace).
- Fields:
- - code: string (e.g., starter, pro, enterprise)
- - name: string
- - description: string
- - stripePriceId: string
- - currency: string (e.g., usd)
- - interval: "month" | "year"
- - isActive: boolean
- - sortOrder: number
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: plans/{planId}
- Fields:
- - planId: string
- - name: string
- - status: "active" | "deprecated"
- - features: {
-     maxWorkspaces?: number,
-     maxUsers?: number,
-     aiAssistants?: boolean,
-     contracts?: boolean,
-     scheduling?: boolean,
-     advancedAnalytics?: boolean
- }
- - stripePriceIds: string[]
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: notification_preferences/{prefId}
- Purpose: User-level alert control (support-critical).
- Fields:
- - workspaceId: string
- - userId: string
- - emailEnabled: boolean
- - smsEnabled: boolean
- - pushEnabled: boolean
- - digestMode: "off" | "daily" | "weekly"
- - quietHours: { enabled: boolean, start: string, end: string, timezone: string }
- - topics: { [topic: string]: boolean }
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: workspace*members/{workspaceId}*{userId} (deterministic ID)
- Fields:
- - workspaceId: string
- - userId: string
- - role: "owner" | "admin" | "manager" | "sales" | "installer" | "viewer"
- - permissions: map
- - canViewFinancials: boolean
- - canEditPricing: boolean
- - canDeleteJobs: boolean
- - status: "active" | "inactive"
- - invitedByUserId: string | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: workspace_invites/{inviteId}
- Purpose: Invite flow that won't break go-live.
- Fields:
- - workspaceId: string
- - email: string
- - role: "owner" | "admin" | "member" | "viewer" | "estimator" | "sales" | "installer"
- - invitedBy: string (uid)
- - tokenHash: string (store a hash, not the raw token)
- - status: "pending" | "accepted" | "expired" | "revoked"
- - expiresAt: timestamp
- - acceptedAt: timestamp | null
- - acceptedBy: string | null (uid)
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: users/{userId}
- Fields:
- - userId: string // == doc id
- - email: string
- - emailNormalized: string
- - displayName: string
- - displayNameNormalized: string
- - photoURL?: string
- - isFounder: boolean // founder bypass flag
- - founderOfWorkspaceIds?: string[] // optional convenience
- - defaultWorkspaceId?: string
- - status: "active" | "disabled"
- - lastLoginAt?: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: agent_runs/{runId}
- Fields:
- - workspaceId: string
- - agentId: string
- - taskId: string | null
- - triggerType: "user" | "workflow" | "schedule" | "system"
- - triggerContext: map | null
- - status: "queued" | "running" | "succeeded" | "failed" | "canceled"
- - startedAt: number | null
- - finishedAt: number | null
- - durationMs: number | null
- - input: map | null
- - output: map | null
- - error: map | null (code, message, stack, retriable)
- - tokensIn: number
- - tokensOut: number
- - usdCost: number | null
- - model: string | null
- - correlationId: string | null
- - createdAt: number
- - updatedAt: number
    \*/

/\*\*

- Collection: agent_logs/{logId}
- Fields:
- - workspaceId: string
- - runId: string
- - agentId: string
- - level: "debug" | "info" | "warn" | "error"
- - message: string
- - payload: map | null
- - stepId: string | null
- - spanId: string | null
- - createdAt: number
- - updatedAt: number
    \*/

/\*\*

- Collection: agent_permissions/{permissionId}
- Fields:
- - workspaceId: string
- - agentId: string
- - toolKey: string
- - scope: "workspace" | "job" | "lead" | "contact" | "system"
- - scopeId: string | null
- - allowed: boolean
- - expiresAt: number | null
- - grantedByUserId: string | null
- - revokedAt: number | null
- - conditions: map | null
- - notes: string | null
- - createdAt: number
- - updatedAt: number
    \*/

/\*\*

- Collection: agent_memory/{memoryId}
- Fields:
- - workspaceId: string
- - agentId: string
- - scope: "workspace" | "job" | "lead" | "contact"
- - scopeId: string | null
- - key: string
- - value: string | map
- - summary: string | null
- - confidence: number | null
- - lastSeenAt: number | null
- - expiresAt: number | null
- - source: "user" | "system" | "inferred"
- - tags: string[]
- - createdAt: number
- - updatedAt: number
    \*/

/\*\*

- Collection: workflow_triggers/{triggerId}
- Fields:
- - workspaceId: string
- - workflowId: string
- - source: "event" | "schedule" | "manual" | "webhook"
- - eventKey: string | null
- - payload: map | null
- - status: "pending" | "processed" | "skipped" | "failed"
- - firedAt: number
- - processedAt: number | null
- - error: string | null
- - correlationId: string | null
- - createdAt: number
- - updatedAt: number
    \*/

/\*\*

- Collection: workflow_conditions/{conditionId}
- Fields:
- - workspaceId: string
- - workflowId: string
- - conditionKey: string
- - operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in" | "exists" | "not_exists"
- - expectedValue: any
- - lastEvaluatedAt: number | null
- - lastResult: boolean | null
- - context: map | null
- - createdAt: number
- - updatedAt: number
    \*/

/\*\*

- Collection: workflow_failures/{failureId}
- Fields:
- - workspaceId: string
- - workflowId: string
- - runId: string
- - stepId: string | null
- - errorCode: string | null
- - message: string
- - details: map | null
- - occurredAt: number
- - resolvedAt: number | null
- - resolvedByUserId: string | null
- - status: "open" | "resolved" | "ignored"
- - retryAttempt: number | null
- - createdAt: number
- - updatedAt: number
    \*/

/\*\*

- Collection: user_sessions/{userSessionId}
- Fields:
- - userId: string
- - ipHash?: string
- - userAgent?: string
- - createdAt: timestamp
- - expiresAt?: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
    \*/

/\*\*

- Collection: workspace_profiles/{workspaceId}
- Fields:
- - workspaceId: string // == doc id
- - name: string
- - nameNormalized: string
- - legalName?: string
- - industry: "flooring" | "roofing" | "solar" | "hvac" | "plumbing" | "general"
- - status: "active" | "paused" | "disabled"
- - ownerUserId: string
- - settings: {
-     timezone?: string,
-     currency?: "USD",
-     locale?: string
- }
- - enabledModules: {
-     flooring?: boolean,
-     crm?: boolean,
-     scheduling?: boolean,
-     contracts?: boolean,
-     billing?: boolean,
-     aiAssistants?: boolean
- }
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: workspace_members/{userId}
- Fields:
- - workspaceId: string
- - userId: string // == doc id
- - role: "owner" | "admin" | "manager" | "rep" | "member" | "viewer"
- - permissions?: {
-     canApproveEnterprisePricing?: boolean,
-     canApproveDiscounts?: boolean,
-     canViewAllEstimates?: boolean,
-     canViewAllContracts?: boolean
- }
- - status: "active" | "invited" | "removed"
- - invitedBy?: string
- - invitedAt?: timestamp
- - joinedAt?: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: workspace_invites/{inviteId}
- Fields:
- - workspaceId: string
- - inviteId: string
- - email: string
- - emailNormalized: string
- - role: "admin" | "manager" | "rep" | "member" | "viewer"
- - tokenHash: string
- - status: "pending" | "accepted" | "expired" | "revoked"
- - expiresAt: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: customers/{customerId}
- Fields:
- - workspaceId: string
- - customerId: string
- - type: "residential" | "commercial"
- - fullName: string
- - normalizedName: string
- - phone?: string
- - email?: string
- - address?: {
-     line1: string,
-     line2?: string,
-     city: string,
-     state: string,
-     zip: string
- }
- - tags?: string[]
- - notes?: string
- - source?: "referral" | "website" | "ads" | "walk-in" | "other"
- - createdBy: string
- - assignedSalesRepId?: string // userId
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: leads/{leadId}
- Fields:
- - workspaceId: string
- - leadId: string
- - fullName?: string
- - normalizedName?: string
- - phone?: string
- - email?: string
- - status: "new" | "contacted" | "scheduled" | "quoted" | "won" | "lost"
- - assignedSalesRepId?: string
- - leadScore?: number
- - lastContactAt?: timestamp
- - nextFollowUpAt?: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: appointments/{appointmentId}
- Fields:
- - workspaceId: string
- - appointmentId: string
- - customerId?: string
- - leadId?: string
- - salesRepId: string // userId
- - title: string // "In-home measure", "Showroom consult"
- - type: "measure" | "consult" | "install" | "follow_up" | "other"
- - scheduledStartAt: timestamp
- - scheduledEndAt: timestamp
- - location?: {
-     line1: string,
-     line2?: string,
-     city: string,
-     state: string,
-     zip: string
- }
- - status: "scheduled" | "confirmed" | "completed" | "no_show" | "canceled"
- - canceledReason?: string
- - notes?: string
- - outcome?: {
-     result: "quoted" | "rescheduled" | "won" | "lost" | "other",
-     summary?: string
- }
- - createdBy: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: estimates/{estimateId}
- Fields:
- - workspaceId: string
- - estimateId: string
- - customerId: string
- - appointmentId?: string
- - salesRepId: string
- - status: "draft" | "presented" | "approved" | "rejected" | "expired" | "converted"
- - presentedAt?: timestamp
- - approvedAt?: timestamp
- - rejectedAt?: timestamp
- - expiresAt?: timestamp
- - pricingModel: "standard" | "enterprise"
- - enterpriseRequested?: boolean
- - enterpriseApproved?: boolean
- - enterpriseApprovedBy?: string // userId
- - enterpriseApprovedAt?: timestamp
- - commissionRatePct: number
- - commissionAmountCents: number
- - subtotalCents: number
- - taxCents: number
- - discountCents: number
- - totalCents: number
- - costCents?: number
- - marginCents?: number
- - marginPct?: number
- - notes?: string
- - createdBy: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: estimate_approvals/{approvalId}
- Fields:
- - workspaceId: string
- - estimateId: string
- - approvalId: string
- - type: "enterprise_pricing" | "discount" | "override"
- - requestedBy: string
- - requestedAt: timestamp
- - decidedBy?: string
- - decidedAt?: timestamp
- - decision?: "approved" | "rejected"
- - reason?: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: commission_rules/{ruleId}
- Fields:
- - workspaceId: string
- - ruleId: string
- - industry: "flooring"
- - minCommissionPct: number
- - maxCommissionPct: number
- - enterpriseApprovalRequired: boolean
- - baseline: {
-     minTotalCents?: number,
-     maxTotalCents?: number
- }
- - updatedBy: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: billing/{billingId}
- Fields:
- - workspaceId: string
- - billingId: string // "default"
- - provider: "stripe"
- - stripeCustomerId?: string
- - planId?: string
- - stripePriceId?: string
- - status: "inactive" | "trialing" | "active" | "past_due" | "canceled"
- - currentPeriodStart?: timestamp
- - currentPeriodEnd?: timestamp
- - cancelAtPeriodEnd?: boolean
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: billing_events/{eventId}
- Fields:
- - workspaceId: string
- - eventId: string
- - provider: "stripe"
- - type: string // e.g. "invoice.paid"
- - payload: object
- - receivedAt: timestamp
- - processedAt?: timestamp
- - processingStatus: "received" | "processed" | "failed"
- - error?: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: contracts/{contractId}
- Fields:
- - workspaceId: string
- - contractId: string
- - estimateId: string
- - customerId: string
- - salesRepId: string
- - provider: "docusign"
- - status: "draft" | "sent" | "delivered" | "signed" | "declined" | "voided" | "error"
- - docusignEnvelopeId?: string
- - docusignTemplateId?: string
- - sentAt?: timestamp
- - deliveredAt?: timestamp
- - signedAt?: timestamp
- - declinedAt?: timestamp
- - voidedAt?: timestamp
- - documentUrl?: string
- - auditTrailUrl?: string
- - error?: { code?: string, message?: string }
- - createdBy: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: contract_signers/{signerId}
- Fields:
- - workspaceId: string
- - contractId: string
- - signerId: string
- - name: string
- - email: string
- - role: "customer" | "co_signer" | "company"
- - status: "pending" | "signed" | "declined"
- - signedAt?: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: commissions/{commissionId}
- Fields:
- - workspaceId: string
- - commissionId: string
- - salesRepId: string
- - estimateId: string
- - contractId?: string
- - commissionRatePct: number
- - commissionAmountCents: number
- - status: "pending" | "approved" | "paid" | "voided"
- - approvedBy?: string
- - approvedAt?: timestamp
- - payoutId?: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: payouts/{payoutId}
- Fields:
- - workspaceId: string
- - payoutId: string
- - payeeUserId: string // salesRepId
- - periodStartAt: timestamp
- - periodEndAt: timestamp
- - totalAmountCents: number
- - status: "draft" | "approved" | "sent" | "paid" | "failed"
- - method?: "ach" | "manual" | "other"
- - reference?: string
- - createdBy: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: payout_items/{itemId}
- Fields:
- - workspaceId: string
- - payoutId: string
- - itemId: string
- - commissionId: string
- - amountCents: number
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: products/{productId}
- Fields:
- - workspaceId: string
- - productId: string
- - type: "flooring" | "underlayment" | "baseboard" | "adhesive" | "other"
- - name: string
- - normalizedName: string
- - sku?: string
- - brand?: string
- - unit: "sqft" | "box" | "unit"
- - priceCents?: number
- - costCents?: number
- - active: boolean
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: threads/{threadId}
- Fields:
- - workspaceId: string
- - threadId: string
- - customerId?: string
- - leadId?: string
- - channel: "sms" | "email" | "in_app" | "other"
- - subject?: string
- - lastMessageAt: timestamp
- - assignedTo?: string // userId
- - status: "open" | "pending" | "closed"
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: thread_messages/{messageId}
- Fields:
- - workspaceId: string
- - threadId: string
- - messageId: string
- - direction: "inbound" | "outbound"
- - body: string
- - sentBy?: string
- - receivedFrom?: string
- - sentAt?: timestamp
- - deliveredAt?: timestamp
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
    \*/

/\*\*

- Collection: agents/{agentId}
- Fields:
- - workspaceId: string
- - agentId: string
- - name: string
- - type: "assistant" | "scorer" | "follow_up" | "estimator" | "router"
- - enabled: boolean
- - config: object
- - createdBy: string
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- Collection: audit_logs/{logId}
- Fields:
- - workspaceId: string
- - logId: string
- - actorUserId?: string
- - actorRole?: string
- - action: string
- - entityType?: string
- - entityId?: string
- - result: "allowed" | "denied" | "error" | "success"
- - reason?: string
- - metadata?: object
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
    \*/
