// Firestore data model documentation for workspaces, members, invites, and users

/**
 * Collection: workspaces/{workspaceId}
 * Fields:
 * - name: string
 * - slug: string
 * - ownerUserId: string
 * - timezone: string
 * - status: "active" | "inactive" | "archived"
 * - branding: map
 * - settings: map
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: agent_types/{typeId}
 * Purpose: Master list of agent templates (global catalog).
 * Fields:
 * - type: string (unique key, e.g., estimator_agent)
 * - name: string
 * - category: "sales" | "ops" | "estimating" | "install" | "admin" | "marketing"
 * - description: string
 * - defaultModel: string
 * - defaultTools: string[] (e.g., firestore_read, firestore_write, pdf_generate)
 * - defaultPrompt: string
 * - inputSchema: object (json-like, lightweight)
 * - outputSchema: object
 * - isActive: boolean
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: agent_instances/{agentInstanceId}
 * Purpose: What a workspace actually has enabled.
 * Fields:
 * - workspaceId: string
 * - agentType: string (ref agent_types.type)
 * - name: string (custom display name)
 * - status: "enabled" | "disabled" | "paused"
 * - config: { temperature: number, maxTokens: number, tone: string, allowedCollections: string[] }
 * - guardrails: { canSendSms: boolean, canEmail: boolean, canCreateEstimates: boolean, canEditPrices: boolean, requiresApprovalFor: string[] }
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: agent_permissions/{permissionId}
 * Purpose: Enforced scopes by agent instance (not just in prompt).
 * Fields:
 * - workspaceId: string
 * - agentInstanceId: string
 * - scopes: string[] (examples: read:leads, write:estimates, read:jobs, write:tasks)
 * - fieldRestrictions: { [collection: string]: { denyWriteFields: string[], allowWriteFields: string[] } }
 * - requiresHumanApproval: string[] (actions)
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: agent_queues/{queueId}
 * Purpose: Task queue for orchestrator (required).
 * Fields:
 * - workspaceId: string
 * - agentInstanceId: string
 * - jobType: string (e.g., lead_followup, estimate_draft, doc_generate, status_update)
 * - priority: number (1–10)
 * - payload: object
 * - status: "queued" | "locked" | "running" | "succeeded" | "failed" | "canceled"
 * - scheduledAt: timestamp
 * - lockedAt: timestamp | null
 * - lockedBy: string | null
 * - attempts: number
 * - maxAttempts: number
 * - lastError: { code: string, message: string } | null
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: agent_runs/{runId}
 * Purpose: Every run is auditable.
 * Fields:
 * - workspaceId: string
 * - agentInstanceId: string
 * - source: "workflow" | "manual" | "system" | "webhook"
 * - sourceRef: { type: string, id: string }
 * - input: object
 * - output: object | null
 * - status: "running" | "succeeded" | "failed" | "canceled"
 * - timing: { startedAt: timestamp, endedAt: timestamp | null, durationMs: number | null }
 * - usage: { promptTokens: number, completionTokens: number, totalTokens: number, costUsd: number }
 * - error: { code: string, message: string, stack: string | null } | null
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: agent_run_steps/{stepId}
 * Purpose: Debugging and trust.
 * Fields:
 * - workspaceId: string
 * - agentRunId: string
 * - order: number
 * - type: "thought" | "tool_call" | "tool_result" | "decision" | "output"
 * - name: string
 * - data: object
 * - createdAt: timestamp
 */

/**
 * Collection: agent_memory/{memoryId}
 * Purpose: Safe, scoped memory.
 * Fields:
 * - workspaceId: string
 * - scope: "workspace" | "lead" | "contact" | "job" | "estimate"
 * - scopeId: string
 * - summary: string
 * - facts: string[]
 * - lastRefreshedAt: timestamp
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: prompt_templates/{templateId}
 * Purpose: Version control prompts like code.
 * Fields:
 * - workspaceId: string | null (null = global default)
 * - key: string (e.g., estimator_agent_v1)
 * - version: number
 * - prompt: string
 * - notes: string
 * - isActive: boolean
 * - createdAt: timestamp
 * - createdBy: string
 */

/**
 * Collection: entitlements/{entitlementId}
 * Purpose: The single source of truth for what a workspace can do.
 * Fields:
 * - workspaceId: string
 * - planCode: string (matches plans.code)
 * - status: "active" | "past_due" | "canceled" | "trialing" | "paused"
 * - limits: { seats: number, agents: number, workflows: number, runsPerMonth: number, documentsPerMonth: number }
 * - features: { [flag: string]: boolean } (e.g., aiAgents, workflowAutomation, sms, email, eSign, providerIntegrations, advancedAnalytics)
 * - period: { start: timestamp, end: timestamp }
 * - trialEndsAt: timestamp | null
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: billing_customers/{customerId}
 * Purpose: Billing customer mapping for a workspace.
 * Fields:
 * - workspaceId: string
 * - stripeCustomerId: string
 * - email: string
 * - name: string | null
 * - billingStatus: "ok" | "needs_payment_method" | "past_due" | "canceled"
 * - defaultPaymentMethodLast4: string | null
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: billing_subscriptions/{subscriptionId}
 * Purpose: Workspace subscription state.
 * Fields:
 * - workspaceId: string
 * - stripeSubscriptionId: string
 * - planCode: string
 * - stripePriceId: string
 * - status: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "paused"
 * - cancelAtPeriodEnd: boolean
 * - currentPeriodStart: timestamp
 * - currentPeriodEnd: timestamp
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: usage_counters/{counterId}
 * Purpose: Hard-enforcement counters (resets monthly).
 * Fields:
 * - workspaceId: string
 * - periodKey: string (format: YYYY-MM, e.g., 2026-01)
 * - seatsUsed: number
 * - agentsEnabled: number
 * - workflowRuns: number
 * - agentRuns: number
 * - documentsGenerated: number
 * - storageBytes: number
 * - updatedAt: timestamp
 */

/**
 * Collection: plans/{planId}
 * Purpose: Global plan catalog (not per workspace).
 * Fields:
 * - code: string (e.g., starter, pro, enterprise)
 * - name: string
 * - description: string
 * - stripePriceId: string
 * - currency: string (e.g., usd)
 * - interval: "month" | "year"
 * - isActive: boolean
 * - sortOrder: number
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: notification_preferences/{prefId}
 * Purpose: User-level alert control (support-critical).
 * Fields:
 * - workspaceId: string
 * - userId: string
 * - emailEnabled: boolean
 * - smsEnabled: boolean
 * - pushEnabled: boolean
 * - digestMode: "off" | "daily" | "weekly"
 * - quietHours: { enabled: boolean, start: string, end: string, timezone: string }
 * - topics: { [topic: string]: boolean }
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: workspace_members/{workspaceId}_{userId} (deterministic ID)
 * Fields:
 * - workspaceId: string
 * - userId: string
 * - role: "owner" | "admin" | "manager" | "sales" | "installer" | "viewer"
 * - permissions: map
 * - canViewFinancials: boolean
 * - canEditPricing: boolean
 * - canDeleteJobs: boolean
 * - status: "active" | "inactive"
 * - invitedByUserId: string | null
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: workspace_invites/{inviteId}
 * Purpose: Invite flow that won't break go-live.
 * Fields:
 * - workspaceId: string
 * - email: string
 * - role: "owner" | "admin" | "member" | "viewer" | "estimator" | "sales" | "installer"
 * - invitedBy: string (uid)
 * - tokenHash: string (store a hash, not the raw token)
 * - status: "pending" | "accepted" | "expired" | "revoked"
 * - expiresAt: timestamp
 * - acceptedAt: timestamp | null
 * - acceptedBy: string | null (uid)
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */

/**
 * Collection: users/{userId}
 * Fields:
 * - defaultWorkspaceId: string | null
 * - recentWorkspaceIds: string[] (optional)
 * - onboardingComplete: boolean
 */

/**
 * Collection: agent_runs/{runId}
 * Fields:
 * - workspaceId: string
 * - agentId: string
 * - taskId: string | null
 * - triggerType: "user" | "workflow" | "schedule" | "system"
 * - triggerContext: map | null
 * - status: "queued" | "running" | "succeeded" | "failed" | "canceled"
 * - startedAt: number | null
 * - finishedAt: number | null
 * - durationMs: number | null
 * - input: map | null
 * - output: map | null
 * - error: map | null (code, message, stack, retriable)
 * - tokensIn: number
 * - tokensOut: number
 * - usdCost: number | null
 * - model: string | null
 * - correlationId: string | null
 * - createdAt: number
 * - updatedAt: number
 */

/**
 * Collection: agent_logs/{logId}
 * Fields:
 * - workspaceId: string
 * - runId: string
 * - agentId: string
 * - level: "debug" | "info" | "warn" | "error"
 * - message: string
 * - payload: map | null
 * - stepId: string | null
 * - spanId: string | null
 * - createdAt: number
 * - updatedAt: number
 */

/**
 * Collection: agent_permissions/{permissionId}
 * Fields:
 * - workspaceId: string
 * - agentId: string
 * - toolKey: string
 * - scope: "workspace" | "job" | "lead" | "contact" | "system"
 * - scopeId: string | null
 * - allowed: boolean
 * - expiresAt: number | null
 * - grantedByUserId: string | null
 * - revokedAt: number | null
 * - conditions: map | null
 * - notes: string | null
 * - createdAt: number
 * - updatedAt: number
 */

/**
 * Collection: agent_memory/{memoryId}
 * Fields:
 * - workspaceId: string
 * - agentId: string
 * - scope: "workspace" | "job" | "lead" | "contact"
 * - scopeId: string | null
 * - key: string
 * - value: string | map
 * - summary: string | null
 * - confidence: number | null
 * - lastSeenAt: number | null
 * - expiresAt: number | null
 * - source: "user" | "system" | "inferred"
 * - tags: string[]
 * - createdAt: number
 * - updatedAt: number
 */

/**
 * Collection: workflow_triggers/{triggerId}
 * Fields:
 * - workspaceId: string
 * - workflowId: string
 * - source: "event" | "schedule" | "manual" | "webhook"
 * - eventKey: string | null
 * - payload: map | null
 * - status: "pending" | "processed" | "skipped" | "failed"
 * - firedAt: number
 * - processedAt: number | null
 * - error: string | null
 * - correlationId: string | null
 * - createdAt: number
 * - updatedAt: number
 */

/**
 * Collection: workflow_conditions/{conditionId}
 * Fields:
 * - workspaceId: string
 * - workflowId: string
 * - conditionKey: string
 * - operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in" | "exists" | "not_exists"
 * - expectedValue: any
 * - lastEvaluatedAt: number | null
 * - lastResult: boolean | null
 * - context: map | null
 * - createdAt: number
 * - updatedAt: number
 */

/**
 * Collection: workflow_failures/{failureId}
 * Fields:
 * - workspaceId: string
 * - workflowId: string
 * - runId: string
 * - stepId: string | null
 * - errorCode: string | null
 * - message: string
 * - details: map | null
 * - occurredAt: number
 * - resolvedAt: number | null
 * - resolvedByUserId: string | null
 * - status: "open" | "resolved" | "ignored"
 * - retryAttempt: number | null
 * - createdAt: number
 * - updatedAt: number
 */
