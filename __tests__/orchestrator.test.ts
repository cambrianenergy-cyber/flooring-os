// Tests for orchestrator: locking, retries, concurrency, entitlement checks
import { Orchestrator, OrchestratorAdapter } from "../src/workers/orchestrator";
import { MockAgentExecutor } from "../src/workers/agent-executor";
import type {
  AgentInstance,
  AgentInstancePermission,
  AgentInstanceRun,
  AgentQueueItem,
  Entitlement,
} from "../src/lib/types";

// In-memory test adapter for controlled testing
class InMemoryOrchestratorAdapter implements OrchestratorAdapter {
  public queue: Map<string, AgentQueueItem> = new Map();
  public agents: Map<string, AgentInstance> = new Map();
  public permissions: Map<string, AgentInstancePermission> = new Map();
  public entitlements: Map<string, Entitlement> = new Map();
  public runs: Map<string, AgentInstanceRun> = new Map();
  public systemEvents: Array<unknown> = [];
  public errorReports: Array<unknown> = [];

  private runIdCounter = 1;

  async fetchNextQueueItem(now: number): Promise<AgentQueueItem | null> {
    const items = Array.from(this.queue.values())
      .filter((item) => item.status === "queued" && item.scheduledAt <= now)
      .sort((a, b) => {
        // Priority desc, then scheduledAt asc
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.scheduledAt - b.scheduledAt;
      });

    return items[0] || null;
  }

  async lockQueueItem(queueId: string, runnerId: string, now: number): Promise<boolean> {
    const item = this.queue.get(queueId);
    if (!item) return false;

    const lockExpiryMs = 300_000;
    // Check if already locked by another runner
    if (item.lockedBy && item.lockedBy !== runnerId && item.lockedAt && item.lockedAt > now - lockExpiryMs) {
      return false;
    }

    if (item.status !== "queued") return false;

    item.status = "locked";
    item.lockedBy = runnerId;
    item.lockedAt = now;
    item.updatedAt = now;
    return true;
  }

  async markQueueItemRunning(queueId: string, runnerId: string, now: number): Promise<void> {
    const item = this.queue.get(queueId);
    if (item) {
      item.status = "running";
      item.updatedAt = now;
    }
  }

  async markQueueItemResult(
    queueId: string,
    result:
      | { status: "succeeded"; output: Record<string, unknown> | null; finishedAt: number }
      | { status: "failed"; error: { code?: string; message: string }; finishedAt: number; attempts: number; maxAttempts: number }
  ): Promise<void> {
    const item = this.queue.get(queueId);
    if (!item) return;

    if (result.status === "succeeded") {
      item.status = "succeeded";
      item.lockedBy = null;
      item.lockedAt = null;
      item.updatedAt = result.finishedAt;
    } else {
      const shouldRetry = result.attempts < result.maxAttempts;
      item.status = shouldRetry ? "queued" : "failed";
      item.lastError = { code: result.error.code ?? "unknown_error", message: result.error.message };
      item.attempts = result.attempts;
      const backoffMs = Math.min(60_000, 1000 * Math.pow(2, result.attempts));
      item.scheduledAt = shouldRetry ? result.finishedAt + backoffMs : result.finishedAt;
      item.lockedBy = null;
      item.lockedAt = null;
      item.updatedAt = result.finishedAt;
    }
  }

  async releaseLock(queueId: string, runnerId: string): Promise<void> {
    const item = this.queue.get(queueId);
    if (item && item.lockedBy === runnerId) {
      item.status = "queued";
      item.lockedBy = null;
      item.lockedAt = null;
      item.updatedAt = Date.now();
    }
  }

  async loadAgentInstance(agentInstanceId: string): Promise<AgentInstance | null> {
    return this.agents.get(agentInstanceId) || null;
  }

  async loadAgentPermissions(agentInstanceId: string): Promise<AgentInstancePermission | null> {
    return this.permissions.get(agentInstanceId) || null;
  }

  async loadEntitlements(workspaceId: string): Promise<Entitlement | null> {
    return this.entitlements.get(workspaceId) || null;
  }

  async createAgentRun(params: {
    queue: AgentQueueItem;
    agent: AgentInstance;
    startedAt: number;
    runnerId: string;
  }): Promise<AgentInstanceRun> {
    const runId = `run-${this.runIdCounter++}`;
    const run: AgentInstanceRun = {
      id: runId,
      workspaceId: params.agent.workspaceId,
      agentInstanceId: params.agent.id!,
      source: "system",
      sourceRef: { type: "queue", id: params.queue.id! },
      input: params.queue.payload,
      output: null,
      status: "running",
      timing: { startedAt: params.startedAt, endedAt: null, durationMs: null },
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
      error: null,
      createdAt: params.startedAt,
      updatedAt: params.startedAt,
    };

    this.runs.set(runId, run);
    return run;
  }

  async completeAgentRun(runId: string, updates: Partial<AgentInstanceRun>): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      Object.assign(run, updates);
      run.updatedAt = Date.now();
    }
  }

  async recordSystemEvent(event: unknown): Promise<void> {
    this.systemEvents.push(event);
  }

  async recordErrorReport(error: unknown): Promise<void> {
    this.errorReports.push(error);
  }
}

describe("Orchestrator", () => {
  let adapter: InMemoryOrchestratorAdapter;
  let executor: MockAgentExecutor;
  let orchestrator: Orchestrator;

  beforeEach(() => {
    adapter = new InMemoryOrchestratorAdapter();
    executor = new MockAgentExecutor();
    orchestrator = new Orchestrator(adapter, executor, { pollIntervalMs: 100, runnerId: "test-runner" });
  });

  afterEach(() => {
    orchestrator.stop();
  });

  it("should return idle when queue is empty", async () => {
    const result = await orchestrator.runOnce();
    expect(result.status).toBe("idle");
  });

  it("should process a queued item successfully", async () => {
    const agent: AgentInstance = {
      id: "agent-1",
      workspaceId: "ws-1",
      agentType: "sales",
      name: "Test Agent",
      status: "enabled",
      config: { temperature: 0.7, maxTokens: 1000, tone: "professional", allowedCollections: [] },
      guardrails: {
        canSendSms: true,
        canEmail: true,
        canCreateEstimates: false,
        canEditPrices: false,
        requiresApprovalFor: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const permission: AgentInstancePermission = {
      id: "perm-1",
      workspaceId: "ws-1",
      agentInstanceId: "agent-1",
      scopes: ["workspace"],
      fieldRestrictions: {},
      requiresHumanApproval: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const entitlement: Entitlement = {
      id: "ent-1",
      workspaceId: "ws-1",
      planCode: "pro",
      status: "active",
      limits: { seats: 10, agents: 5, workflows: 100, runsPerMonth: 10000, documentsPerMonth: 1000 },
      features: {},
      period: { start: Date.now() - 86400000, end: Date.now() + 86400000 },
      trialEndsAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const queueItem: AgentQueueItem = {
      id: "queue-1",
      workspaceId: "ws-1",
      agentInstanceId: "agent-1",
      jobType: "test-job",
      priority: 5,
      payload: { test: "data" },
      status: "queued",
      scheduledAt: Date.now(),
      lockedAt: null,
      lockedBy: null,
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    adapter.queue.set("queue-1", queueItem);
    adapter.agents.set("agent-1", agent);
    adapter.permissions.set("agent-1", permission);
    adapter.entitlements.set("ws-1", entitlement);

    const result = await orchestrator.runOnce();

    expect(result.status).toBe("succeeded");
    if (result.status === "succeeded") {
      expect(result.queueId).toBe("queue-1");
    }
    expect(queueItem.status).toBe("succeeded");
    expect(adapter.runs.size).toBe(1);
    expect(adapter.systemEvents.length).toBeGreaterThan(0);
  });

  it("should handle lock contention between two runners", async () => {
    const agent: AgentInstance = {
      id: "agent-1",
      workspaceId: "ws-1",
      agentType: "sales",
      name: "Test Agent",
      status: "enabled",
      config: { temperature: 0.7, maxTokens: 1000, tone: "professional", allowedCollections: [] },
      guardrails: {
        canSendSms: true,
        canEmail: true,
        canCreateEstimates: false,
        canEditPrices: false,
        requiresApprovalFor: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const queueItem: AgentQueueItem = {
      id: "queue-1",
      workspaceId: "ws-1",
      agentInstanceId: "agent-1",
      jobType: "test-job",
      priority: 5,
      payload: { test: "data" },
      status: "queued",
      scheduledAt: Date.now(),
      lockedAt: null,
      lockedBy: null,
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    adapter.queue.set("queue-1", queueItem);
    adapter.agents.set("agent-1", agent);

    // Lock by another runner
    const now = Date.now();
    queueItem.status = "locked";
    queueItem.lockedBy = "other-runner";
    queueItem.lockedAt = now;

    const result = await orchestrator.runOnce();

    expect(result.status).toBe("contended");
    if (result.status === "contended") {
      expect(result.queueId).toBe("queue-1");
    }
  });

  it("should retry on failure with exponential backoff", async () => {
    const agent: AgentInstance = {
      id: "agent-1",
      workspaceId: "ws-1",
      agentType: "sales",
      name: "Test Agent",
      status: "enabled",
      config: { temperature: 0.7, maxTokens: 1000, tone: "professional", allowedCollections: [] },
      guardrails: {
        canSendSms: true,
        canEmail: true,
        canCreateEstimates: false,
        canEditPrices: false,
        requiresApprovalFor: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const permission: AgentInstancePermission = {
      id: "perm-1",
      workspaceId: "ws-1",
      agentInstanceId: "agent-1",
      scopes: ["workspace"],
      fieldRestrictions: {},
      requiresHumanApproval: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const entitlement: Entitlement = {
      id: "ent-1",
      workspaceId: "ws-1",
      planCode: "pro",
      status: "active",
      limits: { seats: 10, agents: 5, workflows: 100, runsPerMonth: 10000, documentsPerMonth: 1000 },
      features: {},
      period: { start: Date.now() - 86400000, end: Date.now() + 86400000 },
      trialEndsAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const queueItem: AgentQueueItem = {
      id: "queue-1",
      workspaceId: "ws-1",
      agentInstanceId: "agent-1",
      jobType: "test-job",
      priority: 5,
      payload: { test: "data" },
      status: "queued",
      scheduledAt: Date.now(),
      lockedAt: null,
      lockedBy: null,
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    adapter.queue.set("queue-1", queueItem);
    adapter.agents.set("agent-1", agent);
    adapter.permissions.set("agent-1", permission);
    adapter.entitlements.set("ws-1", entitlement);

    // Mock executor to fail
    const failingExecutor = {
      async execute() {
        return {
          status: "failed" as const,
          error: { code: "test_error", message: "Test failure", retriable: true },
          steps: [],
        };
      },
    };

    const failingOrchestrator = new Orchestrator(adapter, failingExecutor, {
      pollIntervalMs: 100,
      runnerId: "test-runner",
    });

    const initialScheduledAt = queueItem.scheduledAt;
    const result = await failingOrchestrator.runOnce();

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.queueId).toBe("queue-1");
    }
    expect(queueItem.status).toBe("queued"); // Should retry
    expect(queueItem.attempts).toBe(1);
    expect(queueItem.scheduledAt).toBeGreaterThan(initialScheduledAt); // Backoff applied
    expect(queueItem.lastError?.message).toBe("Test failure");
  });

  it("should fail permanently after max retries", async () => {
    const agent: AgentInstance = {
      id: "agent-1",
      workspaceId: "ws-1",
      agentType: "sales",
      name: "Test Agent",
      status: "enabled",
      config: { temperature: 0.7, maxTokens: 1000, tone: "professional", allowedCollections: [] },
      guardrails: {
        canSendSms: true,
        canEmail: true,
        canCreateEstimates: false,
        canEditPrices: false,
        requiresApprovalFor: [],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const permission: AgentInstancePermission = {
      id: "perm-1",
      workspaceId: "ws-1",
      agentInstanceId: "agent-1",
      scopes: ["workspace"],
      fieldRestrictions: {},
      requiresHumanApproval: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const entitlement: Entitlement = {
      id: "ent-1",
      workspaceId: "ws-1",
      planCode: "pro",
      status: "active",
      limits: { seats: 10, agents: 5, workflows: 100, runsPerMonth: 10000, documentsPerMonth: 1000 },
      features: {},
      period: { start: Date.now() - 86400000, end: Date.now() + 86400000 },
      trialEndsAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const queueItem: AgentQueueItem = {
      id: "queue-1",
      workspaceId: "ws-1",
      agentInstanceId: "agent-1",
      jobType: "test-job",
      priority: 5,
      payload: { test: "data" },
      status: "queued",
      scheduledAt: Date.now(),
      lockedAt: null,
      lockedBy: null,
      attempts: 2, // Already retried twice
      maxAttempts: 3,
      lastError: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    adapter.queue.set("queue-1", queueItem);
    adapter.agents.set("agent-1", agent);
    adapter.permissions.set("agent-1", permission);
    adapter.entitlements.set("ws-1", entitlement);

    const failingExecutor = {
      async execute() {
        return {
          status: "failed" as const,
          error: { code: "test_error", message: "Test failure", retriable: true },
          steps: [],
        };
      },
    };

    const failingOrchestrator = new Orchestrator(adapter, failingExecutor, {
      pollIntervalMs: 100,
      runnerId: "test-runner",
    });

    const result = await failingOrchestrator.runOnce();

    expect(result.status).toBe("failed");
    expect(queueItem.status).toBe("failed"); // Permanently failed
    expect(queueItem.attempts).toBe(3);
  });
});
