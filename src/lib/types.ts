// agent_runs/{runId} - Durable execution record for every agent run
export interface AgentRun extends FirestoreBase {
  workspaceId: string;
  agentId: string;
  taskId: string | null;
  triggerType: "user" | "workflow" | "schedule" | "system";
  triggerContext: Record<string, unknown> | null;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  startedAt: number | null;
  finishedAt: number | null;
  durationMs: number | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: {
    code?: string | null;
    message?: string | null;
    stack?: string | null;
    retriable?: boolean;
  } | null;
  tokensIn: number;
  tokensOut: number;
  usdCost: number | null;
  model: string | null;
  correlationId: string | null;
}

// agent_logs/{logId} - Structured debug trail for each run
export interface AgentLog extends FirestoreBase {
  workspaceId: string;
  runId: string;
  agentId: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  payload: Record<string, unknown> | null;
  stepId: string | null;
  spanId: string | null;
  createdAt: number;
  updatedAt: number;
}

// agent_permissions/{permissionId} - Fine-grained tool access per agent
export interface AgentPermission extends FirestoreBase {
  workspaceId: string;
  agentId: string;
  toolKey: string;
  scope: "workspace" | "job" | "lead" | "contact" | "system";
  scopeId: string | null;
  allowed: boolean;
  expiresAt: number | null;
  grantedByUserId: string | null;
  revokedAt: number | null;
  conditions: Record<string, unknown> | null;
  notes: string | null;
}

// agent_memory/{memoryId} - Scoped, durable memory for agents
export interface AgentMemory extends FirestoreBase {
  workspaceId: string;
  agentId: string;
  scope: "workspace" | "job" | "lead" | "contact";
  scopeId: string | null;
  key: string;
  value: string | Record<string, unknown>;
  summary: string | null;
  confidence: number | null;
  lastSeenAt: number | null;
  expiresAt: number | null;
  source: "user" | "system" | "inferred";
  tags: string[];
}

// agent_evals/{evalId} - Regression and feedback for agent behavior
export interface AgentEval extends FirestoreBase {
  workspaceId: string;
  agentId: string;
  name: string;
  status: "active" | "inactive";
  type: "regression" | "feedback" | string;
  testCases?: Record<string, unknown>[];
  input?: Record<string, unknown> | string;
  expectedTraits?: string[];
  bannedBehaviors?: string[];
  lastRunAt?: number | null;
  lastScore?: number | null;
  userId?: string | null;
  jobId?: string | null;
  leadId?: string | null;
  score?: number | null;
  feedback?: string | null;
  metadata?: Record<string, unknown>;
}

// agent_prompt_versions/{versionId} - Prompt version control for agents
export interface AgentPromptVersion extends FirestoreBase {
  workspaceId: string;
  agentId: string;
  version: number;
  label: string | null;
  systemPrompt: string;
  policyPrompt: string;
  stylePrompt: string;
  toolsPrompt: string;
  createdByUserId: string;
}

// agent_events/{eventId} - Event log for agent actions and interactions
export interface AgentEvent extends FirestoreBase {
  workspaceId: string;
  agentId: string;
  type: string;
  payload: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  userId?: string | null;
  status?: string;
  error?: string | null;
}

// workspace_knowledge/{docId} - Safe, scoped company brain (RAG layer)
export interface WorkspaceKnowledge extends FirestoreBase {
  workspaceId: string;
  type?: "faq" | "pricing_rules" | "vendor_terms" | "install_checklists" | "sales_scripts" | "policies";
  title: string;
  body?: string;
  content?: string;
  visibility?: "team" | "admin_only";
  tags?: string[];
  status?: "active" | "inactive";
  sourceUrl?: string | null;
}

// workflow_templates/{templateId} - Reusable workflow definitions
export interface WorkflowTemplate extends FirestoreBase {
  workspaceId?: string; // undefined = global template
  name: string;
  description: string | null;
  category: string; // e.g., "lead-routing", "job-scheduling", "follow-up"
  steps: Array<{
    stepId: string;
    actionType: string; // e.g., "send-sms", "create-task", "update-lead-status"
    params: Record<string, unknown>;
    condition?: Record<string, unknown>; // Optional: conditions to execute this step
    nextStepId?: string | null;
  }>;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// workflow_triggers/{triggerId} - When and why a workflow fired
export interface WorkflowTrigger extends FirestoreBase {
  workspaceId: string;
  workflowId: string;
  source: "event" | "schedule" | "manual" | "webhook";
  eventKey: string | null;
  payload: Record<string, unknown> | null;
  status: "pending" | "processed" | "skipped" | "failed";
  firedAt: number;
  processedAt: number | null;
  error: string | null;
  correlationId: string | null;
}

// workflow_schedules/{scheduleId} - Time-based workflow triggers
export interface WorkflowSchedule extends FirestoreBase {
  workspaceId: string;
  workflowId: string;
  timezone: string; // e.g., "America/Chicago"
  scheduleType: "interval" | "daily" | "weekly" | "monthly" | "cron";
  intervalMinutes: number | null; // For interval-based schedules
  atTime: string | null; // HH:MM format for daily/weekly/monthly
  daysOfWeek: number[] | null; // 0=Sunday, 1=Monday, etc.
  cronExpression: string | null; // For advanced cron-based schedules
  enabled: boolean;
  lastRunAt: number | null;
  nextRunAt: number | null;
}

// workflow_locks/{lockId} - Prevent concurrent execution
export interface WorkflowLock extends FirestoreBase {
  key: string; // Unique lock identifier (e.g., "workflow:{workflowId}:lead:{leadId}")
  lockedBy: string; // Process ID or execution ID
  lockedAt: number;
  expiresAt: number; // Timestamp when lock expires
}

// workflow_conditions/{conditionId} - Guardrails evaluated before executing steps
export interface WorkflowCondition extends FirestoreBase {
  workspaceId: string;
  workflowId: string;
  conditionKey: string;
  operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in" | "exists" | "not_exists";
  expectedValue: unknown;
  lastEvaluatedAt: number | null;
  lastResult: boolean | null;
  context: Record<string, unknown> | null;
}

// workflow_failures/{failureId} - Durable record of workflow errors
export interface WorkflowFailure extends FirestoreBase {
  workspaceId: string;
  workflowId: string;
  runId: string;
  stepId: string | null;
  errorCode: string | null;
  message: string;
  details: Record<string, unknown> | null;
  occurredAt: number;
  resolvedAt: number | null;
  resolvedByUserId: string | null;
  status: "open" | "resolved" | "ignored";
  retryAttempt: number | null;
}

// agent_approvals/{approvalId} - Human gate for agent actions
export interface AgentApproval extends FirestoreBase {
  workspaceId: string;
  taskId: string;
  agentId: string;
  toolKey: string;
  proposal: Record<string, unknown>;
  summary: string;
  payload: Record<string, unknown>;
  preview: Record<string, unknown> | null;
  status: "pending" | "approved" | "rejected" | "expired";
  requestedBy: Record<string, unknown>;
  type: "agent" | "system";
  reviewedByUserId: string | null;
  reviewedAt: number | null;
  expiresAt: number | null;
}
// agent_tools/{toolId} - Permission boundary layer for agent actions
export interface AgentTool extends FirestoreBase {
  workspaceId: string;
  key: string; // unique within workspace
  name: string;
  description: string;
  risk: "low" | "medium" | "high";
  requiresApproval: boolean;
  defaultEnabled: boolean;
  status: "active" | "inactive";
}
// agent_tasks/{taskId} - The runtime record for every AI job (non-negotiable)
export interface AgentTask extends FirestoreBase {
  workspaceId: string;
  createdByUserId: string | null;
  source: "user" | "workflow" | "system";
  status: "queued" | "running" | "awaiting_approval" | "succeeded" | "failed" | "canceled";
  priority: "low" | "normal" | "high";
  agentId: string;
  agentType: string;
  context: Record<string, unknown>;
  jobId: string | null;
  leadId: string | null;
  estimateId: string | null;
  contactId: string | null;
  roomId: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
  code: string | null;
  message: string | null;
  stack: string | null;
  cost: Record<string, unknown>;
  tokensIn: number;
  tokensOut: number;
  usdEstimate: number;
  attempts: number;
  maxAttempts: number;
  lockedBy: string | null;
  lockedAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
}
// inventory_items/{inventoryItemId} - Inventory tracking
export interface InventoryItem extends FirestoreBase {
  workspaceId: string;
  catalogItemId: string;
  qtyOnHand: number;
  reorderPoint: number | null;
  location: string | null;
}
// vendors/{vendorId} - Vendors and suppliers
export interface Vendor extends FirestoreBase {
  workspaceId: string;
  name: string;
  contact: Record<string, unknown> | null;
}
// support_tickets/{ticketId} - Customer support tickets
export interface SupportTicket extends FirestoreBase {
  workspaceId: string;
  createdByUserId: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  subject: string;
  body: string;
}
// notifications/{notificationId} - User and system notifications
export interface Notification extends FirestoreBase {
  workspaceId: string;
  userId: string;
  type: "alert" | "reminder" | "system" | "agent";
  title: string;
  body: string;
  read: boolean;
  link: string | null;
}
// notification_preferences/{prefId} - User-level alert control
export interface NotificationPreference extends FirestoreBase {
  workspaceId: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  digestMode: "off" | "daily" | "weekly";
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  topics: Record<string, boolean>;
}
// audit_logs/{logId} - System and user audit logs
export interface AuditLog {
  workspaceId: string;
  actorType: "system" | "user" | "agent";
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  meta: unknown;
  createdAt: number;
}
// workflow_run_steps/{runStepId} - Steps within a workflow run
export interface WorkflowRunStep extends FirestoreBase {
  workspaceId: string;
  workflowRunId: string;
  stepId: string;
  order: number;
  agentId: string | null;
  agentType: string;
  instruction: string;
  status: "queued" | "running" | "succeeded" | "failed";
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  attempts?: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface WorkflowRunLock {
  by: string;
  at: number;
  expiresAt: number;
}

export interface WorkflowRunLastError {
  message: string;
  stepIndex?: number;
  at: number;
}

export interface WorkflowRunStepSnapshot {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
  status: "pending" | "running" | "succeeded" | "failed" | "skipped";
  attempts?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
  nextAttemptAt?: unknown;
  startedAt?: number;
  finishedAt?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
}

// Lightweight aliases for clients that prefer type aliases over interfaces
export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";
export type StepStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";

export type WorkflowRunDoc = {
  workspaceId: string;
  workflowId: string;
  status: RunStatus;
  createdAt: unknown;
  updatedAt: unknown;
  nextRunnableAt?: unknown;

  lock?: { by: string; at: unknown; expiresAt: unknown } | null;
  nextStepIndex: number;
  attempt: number;
  lastError?: { message: string; stepIndex?: number; at: unknown } | null;

  steps: WorkflowRunStepSnapshot[];
  context?: unknown;
};
// workflow_runs/{runId} - Workflow execution runs
export interface WorkflowRun extends FirestoreBase {
  workspaceId: string;
  workflowId: string;
  triggeredBy: Record<string, unknown>;
  type: "user" | "system" | "event";
  userId: string | null;
  eventKey: string | null;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  context: Record<string, unknown>;
  nextRunnableAt?: number | null;
  jobId: string | null;
  leadId: string | null;
  estimateId: string | null;
  startedAt: number | null;
  finishedAt: number | null;

  // Runner internals for visibility and execution control
  lock: WorkflowRunLock | null;
  nextStepIndex: number; // 0-based
  attempt: number; // run attempt count
  lastError: WorkflowRunLastError | null;

  // Snapshot of workflow steps at time of run (important for reproducibility)
  steps: WorkflowRunStepSnapshot[];
}
// workflows/{workflowId} - Automation workflows
export interface Workflow extends FirestoreBase {
  workspaceId: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  trigger: Record<string, unknown>;
  type: "manual" | "event" | "schedule";
  eventKey: string | null;
  cron: string | null;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
  // Add more fields as needed for step configuration
}
// agents/{agentId} - AI/automation agents
export interface Agent extends FirestoreBase {
  workspaceId: string;
  name: string;
  type: string;
  category: "sales" | "ops" | "finance" | "marketing" | "support";
  description: string;
  status: "enabled" | "disabled";
  visibility: "private" | "team";
  capabilities: string[];
  guardrails: Record<string, unknown>;
  canSendEmail: boolean;
  canCreateDocuments: boolean;
  canAccessFinancials: boolean;
  currentPromptVersion: number;
  // Enterprise-style employee modeling
  jobDescription?: string;
  allowedActions?: string[]; // tool keys or verbs
  performance?: {
    successRate?: number;
    avgLatencyMs?: number;
    avgTokensIn?: number;
    avgTokensOut?: number;
    lastEvaluatedAt?: number | null;
  };
  costAttribution?: {
    currency?: string;
    lastRunUsd?: number | null;
    monthToDateUsd?: number | null;
    lifetimeUsd?: number | null;
  };
  termination?: {
    disabledReason?: string | null;
    disabledAt?: number | null;
    thresholds?: {
      maxFailureRate?: number | null;
      maxUsdPerMonth?: number | null;
      maxTokensPerMonth?: number | null;
    };
  };
}
// calendar_events/{eventId} - Scheduling and calendar events
export interface CalendarEvent extends FirestoreBase {
  workspaceId: string;
  jobId: string | null;
  type: "measure" | "install" | "follow_up" | "meeting";
  title: string;
  startAt: number;
  endAt: number | null;
  assignedUserIds: string[];
  location: Record<string, unknown> | null;
  notes: string | null;
}
// tasks/{taskId} - Workspace tasks and to-dos
export interface Task extends FirestoreBase {
  workspaceId: string;
  title: string;
  description: string | null;
  entityType: "lead" | "contact" | "job" | "estimate" | "appointment" | null;
  entityId: string | null;
  assignedTo: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "todo" | "in_progress" | "blocked" | "done" | "canceled";
  dueAt: number | null;
  reminderAt: number | null;
  tags: string[];
  visibility: "private" | "workspace" | "team";
  softDelete: {
    isDeleted: boolean;
    deletedAt: number | null;
    deletedBy: string | null;
  } | null;
  completedAt: number | null;
  createdBy: string;
  updatedBy: string;
}
// appointments/{appointmentId} - Scheduled appointments
export interface Appointment extends FirestoreBase {
  workspaceId: string;
  type: "measure" | "install" | "follow_up" | "meeting" | "consultation";
  entityType: "lead" | "contact" | "job" | "estimate" | null;
  entityId: string | null;
  title: string;
  startAt: number;
  endAt: number | null;
  timezone: string; // e.g., "America/Chicago"
  location: {
    address1?: string;
    address2?: string | null;
    city?: string;
    state?: string;
    zip?: string;
    notes?: string | null;
  } | null;
  assignedUserIds: string[];
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "canceled" | "no_show";
  calendarProvider: {
    provider: "none" | "google" | "outlook" | "apple";
    externalEventId: string | null;
  } | null;
  checkIn: {
    status: "not_checked_in" | "checked_in" | "checked_out";
    checkedInAt: number | null;
    lat: number | null;
    lng: number | null;
  } | null;
  cancelReason: string | null;
  softDelete: {
    isDeleted: boolean;
    deletedAt: number | null;
    deletedBy: string | null;
  } | null;
  createdBy: string;
  updatedBy: string;
}
// payments/{paymentId} - Payment records
export interface Payment extends FirestoreBase {
  workspaceId: string;
  jobId: string;
  invoiceId: string | null;
  method: "cash" | "check" | "card" | "ach" | "stripe";
  amount: number;
  providerRef: string | null;
  receivedAt: number;
}
// invoices/{invoiceId} - Payment and billing invoices
export interface Invoice extends FirestoreBase {
  workspaceId: string;
  jobId: string;
  estimateId: string | null;
  status: "draft" | "sent" | "paid" | "partial" | "void";
  dueAt: number | null;
  subtotal: number;
  tax: number;
  total: number;
  balanceDue: number;
}
// attachments/{attachmentId} - File attachments for jobs, rooms, etc.
export interface Attachment extends FirestoreBase {
  workspaceId: string;
  jobId: string | null;
  entityType: "job" | "room" | "estimate" | "document" | "lead";
  entityId: string;
  name: string;
  mimeType: string;
  url: string;
  uploadedByUserId: string;
}
// files/{fileId} - Universal file storage and management
export interface File extends FirestoreBase {
  workspaceId: string;
  ownerType: "user" | "contact" | "lead" | "job" | "estimate" | "room" | "workspace";
  ownerId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string; // Firebase Storage path
  downloadUrl: string | null; // Optional if generated on demand
  tags: string[];
  visibility: "private" | "workspace" | "shared_link";
  sharedLink: {
    token: string | null;
    expiresAt: number | null;
    password: string | null;
  } | null;
  thumbnail: {
    storagePath: string | null;
    downloadUrl: string | null;
  } | null;
  metadata: {
    width?: number | null;
    height?: number | null;
    duration?: number | null; // for videos
    pageCount?: number | null; // for PDFs
  } | null;
  scanStatus: "pending" | "clean" | "infected" | "failed" | null;
  createdBy: string;
  updatedBy: string;
}
// documents/{documentId} - Proposals, contracts, files, etc.
export interface Document extends FirestoreBase {
  workspaceId: string;
  jobId: string;
  estimateId: string | null;
  type: "proposal" | "contract" | "invoice" | "receipt" | "photo" | "other";
  status: "draft" | "final" | "sent" | "signed";
  title: string;
  fileUrl: string | null;
  html: string | null;
  pdfUrl: string | null;
  sentToEmail: string | null;
  signedAt: number | null;
}
// estimate_line_items/{lineItemId} - Line items for an estimate
export interface EstimateLineItem extends FirestoreBase {
  workspaceId: string;
  estimateId: string;
  jobId: string;
  roomId: string | null;
  catalogItemId: string | null;
  name: string;
  type: "material" | "labor" | "service" | "fee";
  qty: number;
  unit: string;
  unitPrice: number;
  unitCost: number | null;
  wastePct: number | null;
  taxable: boolean;
  totalPrice: number;
  totalCost: number | null;
}
// estimates/{estimateId} - Project/job estimate
export interface Estimate extends FirestoreBase {
  workspaceId: string;
  jobId: string;
  version: number;
  status: "draft" | "sent" | "approved" | "rejected" | "expired";
  priceBookId: string | null;
  totals: Record<string, unknown>;
  materials: number;
  labor: number;
  fees: number;
  discount: number;
  tax: number;
  grandTotal: number;
  terms: string | null;
  validUntil: number | null;
  sentAt: number | null;
  approvedAt: number | null;
}
// price_books/{priceBookId} - Price book for catalog pricing
export interface PriceBook extends FirestoreBase {
  workspaceId: string;
  name: string;
  status: Status;
  rules?: Record<string, unknown>[];
}
// catalog_items/{itemId} - Products and services (materials, trims, labor, etc.)
export interface CatalogItem extends FirestoreBase {
  workspaceId: string;
  type: "material" | "labor" | "service" | "fee";
  name: string;
  sku: string | null;
  unit: "sqft" | "lf" | "each" | "hour" | "job";
  baseCost: number | null;
  basePrice: number;
  taxable: boolean;
  defaultWastePct: number | null;
  vendorId: string | null;
  status: Status;
}
// job_measurements/{measurementId} - Raw measurement capture events
export interface JobMeasurement extends FirestoreBase {
  workspaceId: string;
  jobId: string;
  roomId: string | null;
  source: "disto" | "manual" | "photo" | "import";
  data: Record<string, unknown>;
  capturedByUserId: string;
}
// job_rooms/{roomId} - Room within a job
export interface JobRoom extends FirestoreBase {
  workspaceId: string;
  jobId: string;
  name: string;
  floorType: "tile" | "lvp" | "hardwood" | "carpet" | "laminate" | "other";
  measurement: {
    length?: number | null;
    width?: number | null;
    areaSqFt?: number | null;
    perimeterFt?: number | null;
    [key: string]: unknown;
  };
  diagram: Record<string, unknown>;
  type: "disto" | "manual" | "upload";
  data: Record<string, unknown> | null;
  imageUrl: string | null;
}
// jobs/{jobId} - Project/job record
export interface Job extends FirestoreBase {
  workspaceId: string;
  jobNumber: string;
  title: string;
  status: "draft" | "measuring" | "estimating" | "sent" | "approved" | "scheduled" | "in_progress" | "complete" | "canceled";
  customerContactId: string;
  propertyAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    [key: string]: unknown;
  };
  assignedSalesUserId: string | null;
  assignedInstallerUserIds: string[];
  scheduled: Record<string, unknown>;
  measureDate: number | null;
  installStart: number | null;
  installEnd: number | null;
  financials: Record<string, unknown>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  depositRequired: number | null;
  balanceDue: number | null;
  marginEstimate: number | null;
  notes: string | null;
}
// job_status_history/{historyId} - Audit trail for job status changes
export interface JobStatusHistory {
  workspaceId: string;
  jobId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedByType: "user" | "system" | "agent";
  source: "manual" | "workflow" | "automation" | "api";
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
}
// lead_activities/{activityId} - Activity log for a lead
export interface LeadActivity extends FirestoreBase {
  workspaceId: string;
  leadId: string;
  type: "call" | "text" | "email" | "note" | "visit" | "follow_up";
  body: string;
  createdByUserId: string;
}
// leads/{leadId} - Inbound lead before it becomes a job
export interface Lead extends FirestoreBase {
  workspaceId: string;
  contactId: string | null;
  source: "referral" | "google" | "facebook" | "walkin" | "yard_sign" | "other";
  status: "new" | "contacted" | "scheduled" | "quoted" | "won" | "lost";
  assignedToUserId: string | null;
  valueEstimate: number | null;
  nextFollowUpAt: number | null;
  lostReason: string | null;
}
// contacts/{contactId} - CRM: Leads, Contacts, Customers
export interface Contact extends FirestoreBase {
  workspaceId: string;
  type: "person" | "company";
  fullName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  tags: string[];
  notes: string | null;
}
// conversations/{conversationId} - Communication threads
export interface Conversation extends FirestoreBase {
  workspaceId: string;
  subject: string;
  entityType: "lead" | "contact" | "job" | "estimate";
  entityId: string;
  participants: {
    userIds: string[];
    contactIds: string[];
  };
  channels: string[]; // e.g., ["sms", "email", "in_app"]
  lastMessageAt: number | null;
  status: "open" | "closed" | "archived";
  createdAt: number;
  updatedAt: number;
}
// messages/{messageId} - Individual messages within conversations
export interface Message extends FirestoreBase {
  workspaceId: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  channel: "sms" | "email" | "in_app";
  from: {
    type: "user" | "contact" | "system" | "agent";
    id: string;
    display: string;
  };
  to: {
    type: "user" | "contact" | "system" | "agent";
    id: string;
    display: string;
  };
  body: string;
  attachments: Array<{
    fileId: string;
    name: string;
    url: string;
  }>;
  provider: {
    name: string;
    messageId: string | null;
    status: string | null;
  } | null;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  error: {
    code: string;
    message: string;
  } | null;
  createdAt: number;
  updatedAt: number;
}
// message_templates/{templateId} - Reusable message templates
export interface MessageTemplate extends FirestoreBase {
  workspaceId: string;
  name: string;
  channel: "sms" | "email";
  subject: string | null;
  body: string;
  variables: string[]; // e.g., ["{{customerName}}", "{{estimateTotal}}"]
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
// error_reports/{reportId} - Reliability capture for errors across surfaces
export interface ErrorReport extends FirestoreBase {
  workspaceId?: string;
  environment: "dev" | "staging" | "prod";
  source: "client" | "server" | "agent" | "workflow" | "webhook";
  message: string;
  stack: string | null;
  context: Record<string, unknown>;
  severity: "info" | "warn" | "error" | "critical";
  createdAt: number;
}

// system_events/{eventId} - Operational heartbeat and cron/webhook traces
export interface SystemEvent extends FirestoreBase {
  workspaceId?: string;
  type: "cron_tick" | "webhook_received" | "queue_sweep" | "billing_sync" | string;
  status: "ok" | "failed";
  data: Record<string, unknown>;
  createdAt: number;
}

// feature_flags/{flagId} - Per-workspace feature flag override (undefined = global)
export interface FeatureFlag extends FirestoreBase {
  workspaceId?: string;
  key: string;
  enabled: boolean;
  description: string;
  createdAt: number;
  updatedAt: number;
}

// import_jobs/{importJobId} - Bulk import tracking
export interface ImportJob extends FirestoreBase {
  workspaceId: string;
  type: "leads" | "contacts" | "line_items" | string;
  status: "queued" | "running" | "completed" | "failed";
  fileId: string | null;
  summary: { total: number; success: number; failed: number };
  errors: Array<{ row: number; message: string }>;
  createdAt: number;
  updatedAt: number;
}
// plans/{planId} - Global plan catalog
export interface Plan extends FirestoreBase {
  code: string; // e.g., "starter", "pro", "enterprise"
  name: string;
  description: string;
  stripePriceId: string;
  currency: string; // e.g., "usd"
  interval: "month" | "year";
  isActive: boolean;
  sortOrder: number;
}
// entitlements/{entitlementId} - Workspace capabilities and limits
export interface Entitlement extends FirestoreBase {
  workspaceId: string;
  planCode: string;
  status: "active" | "past_due" | "canceled" | "trialing" | "paused";
  limits: {
    seats: number;
    agents: number;
    workflows: number;
    runsPerMonth: number;
    documentsPerMonth: number;
  };
  features: Record<string, boolean>;
  period: {
    start: number;
    end: number;
  };
  trialEndsAt: number | null;
}
// billing_customers/{customerId} - Billing customer mapping
export interface BillingCustomer extends FirestoreBase {
  workspaceId: string;
  stripeCustomerId: string;
  email: string;
  name: string | null;
  billingStatus: "ok" | "needs_payment_method" | "past_due" | "canceled";
  defaultPaymentMethodLast4: string | null;
}
// billing_subscriptions/{subscriptionId} - Workspace subscription state
export interface BillingSubscription extends FirestoreBase {
  workspaceId: string;
  stripeSubscriptionId: string;
  planCode: string;
  stripePriceId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "paused";
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: number;
  currentPeriodEnd: number;
}
// usage_counters/{counterId} - Monthly hard enforcement counters
export interface UsageCounter extends FirestoreBase {
  workspaceId: string;
  periodKey: string; // YYYY-MM
  seatsUsed: number;
  agentsEnabled: number;
  workflowRuns: number;
  agentRuns: number;
  documentsGenerated: number;
  storageBytes: number;
}
// agent_types/{typeId} - Global agent templates
export interface AgentType extends FirestoreBase {
  type: string;
  name: string;
  category: "sales" | "ops" | "estimating" | "install" | "admin" | "marketing";
  description: string;
  defaultModel: string;
  defaultTools: string[];
  defaultPrompt: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  isActive: boolean;
}
// agent_instances/{agentInstanceId} - Workspace-enabled agents
export interface AgentInstance extends FirestoreBase {
  workspaceId: string;
  agentType: string;
  name: string;
  status: "enabled" | "disabled" | "paused";
  config: {
    temperature: number;
    maxTokens: number;
    tone: string;
    allowedCollections: string[];
  };
  guardrails: {
    canSendSms: boolean;
    canEmail: boolean;
    canCreateEstimates: boolean;
    canEditPrices: boolean;
    requiresApprovalFor: string[];
  };
}
// agent_permissions/{permissionId} - Scopes per agent instance
export interface AgentInstancePermission extends FirestoreBase {
  workspaceId: string;
  agentInstanceId: string;
  scopes: string[];
  fieldRestrictions: Record<string, { denyWriteFields: string[]; allowWriteFields: string[] }>;
  requiresHumanApproval: string[];
}
// agent_queues/{queueId} - Task queue for orchestrator
export interface AgentQueueItem extends FirestoreBase {
  workspaceId: string;
  agentInstanceId: string;
  jobType: string;
  priority: number;
  payload: Record<string, unknown>;
  status: "queued" | "locked" | "running" | "succeeded" | "failed" | "canceled";
  scheduledAt: number;
  lockedAt: number | null;
  lockedBy: string | null;
  attempts: number;
  maxAttempts: number;
  lastError: { code: string; message: string } | null;
}
// agent_runs/{runId} - Auditable runs
export interface AgentInstanceRun extends FirestoreBase {
  workspaceId: string;
  agentInstanceId: string;
  source: "workflow" | "manual" | "system" | "webhook";
  sourceRef: { type: string; id: string };
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  timing: { startedAt: number; endedAt: number | null; durationMs: number | null };
  usage: { promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number };
  error: { code?: string | null; message?: string | null; stack?: string | null; retriable?: boolean } | null;
}
// agent_run_steps/{stepId} - Detailed run trace
export interface AgentInstanceRunStep extends FirestoreBase {
  workspaceId: string;
  agentRunId: string;
  order: number;
  type: "thought" | "tool_call" | "tool_result" | "decision" | "output";
  name: string;
  data: Record<string, unknown>;
}
// agent_memory/{memoryId} - Scoped memory
export interface AgentInstanceMemory extends FirestoreBase {
  workspaceId: string;
  scope: "workspace" | "job" | "lead" | "contact" | "estimate";
  scopeId: string | null;
  summary: string | null;
  facts: string[];
  lastRefreshedAt: number;
}
// prompt_templates/{templateId} - Prompt versioning
export interface PromptTemplate extends FirestoreBase {
  workspaceId?: string;
  key: string;
  version: number;
  prompt: string;
  notes: string;
  isActive: boolean;
  createdBy: string;
}
// subscriptions/{subscriptionId} - Billing and plan gating
export interface Subscription extends FirestoreBase {
  workspaceId: string;
  provider: "stripe";
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  planId: "starter" | "pro" | "agency" | "founder";
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: number | null;
}
// workspace_invites/{inviteId} - Workspace invitation that won't break go-live
export interface WorkspaceInvite extends FirestoreBase {
  workspaceId: string;
  email: string;
  role: WorkspaceInviteRole;
  invitedBy: string;
  tokenHash: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: number;
  acceptedAt: number | null;
  acceptedBy: string | null;
}
// workspaces/{workspaceId} - The company / franchise / team
export interface Workspace extends FirestoreBase {
  name: string;
  slug: string;
  ownerUserId: string;
  timezone: string; // e.g., "America/Chicago"
  industry: string; // e.g., "flooring"
  status: Status;
  branding: Record<string, unknown>;
  logoUrl: string | null;
  primaryColor: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  address: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  defaultTaxRate: number;
  defaultWastePct: number;
  defaultLaborPct: number | null;
  currency: string; // e.g., "USD"
  measurementUnit: "imperial" | "metric";
}
// USERS & WORKSPACES
// users/{userId} - Represents the authenticated user
export interface User extends FirestoreBase {
  displayName: string;
  email: string;
  photoURL: string | null;
  phone: string | null;
  defaultWorkspaceId: string | null;
  onboardingComplete: boolean;
}
// crew/{crewId} - Installation crews
export interface Crew extends FirestoreBase {
  workspaceId: string;
  name: string;
  leadUserId: string | null;
  memberUserIds: string[];
  skills: string[]; // e.g., ["lvp", "baseboards", "tile"]
  territory: string | null;
  capacity: {
    jobsPerDay: number | null;
    maxSqftPerDay: number | null;
  } | null;
  notes: string | null;
  isActive: boolean;
  softDelete: {
    isDeleted: boolean;
    deletedAt: number | null;
    deletedBy: string | null;
  } | null;
}

// Common Firestore base fields and enums
export interface FirestoreBase {
  id?: string; // Firestore document ID
  workspaceId?: string; // Always present except users/* and system/*
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  createdBy?: string | null;
  updatedBy?: string | null;
  status?: string | null;
  userId?: string | null;
  leadId?: string | null;
  jobId?: string | null;
  estimateId?: string | null;
  contactId?: string | null;
  conversationId?: string | null;
}

export type Status = "active" | "inactive" | "archived";
export type Visibility = "public" | "private" | "team";
export type UserRole =
  | "owner"
  | "admin"
  | "manager"
  | "sales"
  | "installer"
  | "viewer"
  | "member"
  | "estimator";
export type WorkspaceInviteRole =
  | "owner"
  | "admin"
  | "member"
  | "viewer"
  | "estimator"
  | "sales"
  | "installer";

// Firestore Product Schema (TypeScript interface)
// Place this in a shared types or models file, e.g., src/lib/types.ts

export interface Product {
  id?: string; // Firestore document ID
  name: string;
  brand: string;
  line?: string;
  color?: string;
  sku: string;
  materialType: 'LVP' | 'Laminate' | 'Hardwood' | 'Tile' | 'Carpet';
  unit: string; // e.g., 'sqft/carton', 'plank size'
  costPerSqft: number;
  sellPricePerSqft: number | { [tier: string]: number };
  stockStatus?: 'in-stock' | 'out-of-stock' | 'limited' | string;
  specSheetUrl?: string; // PDF URL
  images: string[]; // URLs to Firebase Storage
  accessories?: string[]; // e.g., ["padding", "trim", "underlayment"]
  wearLayer?: string; // e.g., thickness, wear layer, etc.
  warrantyNotes?: string;
  waterproof?: boolean;
  petFriendly?: boolean;
  boxCoverageSqft?: number; // Optional: sqft per box/carton
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}
