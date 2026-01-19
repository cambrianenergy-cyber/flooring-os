// Minimal orchestrator loop scaffold: dequeue -> lock -> entitlement/permission checks -> execute -> record run
// The adapter is intentionally abstract so production code can swap Firestore/HTTP/testing backends without changing control flow.
import { AgentInstance, AgentInstanceRun, AgentInstancePermission, AgentQueueItem, Entitlement } from "../lib/types";

export type OrchestratorResult =
  | { status: "idle" }
  | { status: "contended"; queueId: string }
  | { status: "skipped"; queueId: string; reason: string }
  | { status: "succeeded"; queueId: string; runId: string }
  | { status: "failed"; queueId: string; runId: string | null; error: Error };

export interface OrchestratorAdapter {
  fetchNextQueueItem(now: number): Promise<AgentQueueItem | null>;
  lockQueueItem(queueId: string, runnerId: string, now: number): Promise<boolean>;
  markQueueItemRunning(queueId: string, runnerId: string, now: number): Promise<void>;
  markQueueItemResult(
    queueId: string,
    result:
      | { status: "succeeded"; output: Record<string, unknown> | null; finishedAt: number }
      | { status: "failed"; error: { code?: string; message: string }; finishedAt: number; attempts: number; maxAttempts: number }
  ): Promise<void>;
  releaseLock(queueId: string, runnerId: string): Promise<void>;

  loadAgentInstance(agentInstanceId: string): Promise<AgentInstance | null>;
  loadAgentPermissions(agentInstanceId: string): Promise<AgentInstancePermission | null>;
  loadEntitlements(workspaceId: string): Promise<Entitlement | null>;

  createAgentRun(params: {
    queue: AgentQueueItem;
    agent: AgentInstance;
    startedAt: number;
    runnerId: string;
  }): Promise<AgentInstanceRun>;
  completeAgentRun(runId: string, updates: Partial<AgentInstanceRun>): Promise<void>;

  recordSystemEvent(event: {
    workspaceId?: string;
    type: string;
    status: "ok" | "failed";
    data: Record<string, unknown>;
    createdAt: number;
  }): Promise<void>;

  recordErrorReport(error: {
    workspaceId?: string;
    environment: "dev" | "staging" | "prod";
    source: "client" | "server" | "agent" | "workflow" | "webhook";
    message: string;
    stack: string | null;
    context: Record<string, unknown>;
    severity: "info" | "warn" | "error" | "critical";
    createdAt: number;
  }): Promise<void>;
}

export interface AgentExecutorResult {
  status: "succeeded" | "failed";
  output?: Record<string, unknown> | null;
  error?: { code?: string; message: string; retriable?: boolean } | null;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number; costUsd?: number } | null;
  steps?: Array<{ order: number; type: string; name: string; data: Record<string, unknown> }>;
}

export interface AgentExecutor {
  execute(job: AgentQueueItem, agent: AgentInstance): Promise<AgentExecutorResult>;
}

export class Orchestrator {
  private readonly runnerId: string;
  private readonly pollIntervalMs: number;
  private isRunning = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly adapter: OrchestratorAdapter,
    private readonly executor: AgentExecutor,
    options?: { pollIntervalMs?: number; runnerId?: string }
  ) {
    this.pollIntervalMs = options?.pollIntervalMs ?? 2000;
    this.runnerId = options?.runnerId ?? `orchestrator-${Math.random().toString(36).slice(2)}`;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = async () => {
      if (!this.isRunning) return;
      try {
        await this.runOnce();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        // Fire-and-forget; production code may want backpressure/logging.
        void this.adapter.recordErrorReport({
          workspaceId: undefined,
          environment: "dev",
          source: "server",
          message: error.message,
          stack: error.stack ?? null,
          context: { runnerId: this.runnerId, phase: "runOnce" },
          severity: "error",
          createdAt: Date.now(),
        });
      } finally {
        if (this.isRunning) {
          this.pollTimer = setTimeout(loop, this.pollIntervalMs) as unknown as ReturnType<typeof setTimeout>;
        }
      }
    };
    void loop();
  }

  stop() {
    this.isRunning = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }

  async runOnce(): Promise<OrchestratorResult> {
    const now = Date.now();
    const queueItem = await this.adapter.fetchNextQueueItem(now);
    if (!queueItem) return { status: "idle" };
    if (!queueItem.id) return { status: "skipped", queueId: "unknown", reason: "missing id" };

    const locked = await this.adapter.lockQueueItem(queueItem.id, this.runnerId, now);
    if (!locked) return { status: "contended", queueId: queueItem.id };

    let agentRunId: string | null = null;

    try {
      const agent = await this.adapter.loadAgentInstance(queueItem.agentInstanceId);
      if (!agent) {
        await this.failQueue(queueItem, now, "agent_not_found");
        return { status: "failed", queueId: queueItem.id, runId: null, error: new Error("agent not found") };
      }

      const entitlements = await this.adapter.loadEntitlements(agent.workspaceId);
      if (!entitlements) {
        await this.failQueue(queueItem, now, "entitlements_missing");
        return { status: "failed", queueId: queueItem.id, runId: null, error: new Error("entitlements missing") };
      }

      const permissions = await this.adapter.loadAgentPermissions(agent.id ?? "");
      if (!permissions) {
        await this.failQueue(queueItem, now, "permissions_missing");
        return { status: "failed", queueId: queueItem.id, runId: null, error: new Error("permissions missing") };
      }

      await this.adapter.markQueueItemRunning(queueItem.id, this.runnerId, now);

      const run = await this.adapter.createAgentRun({ queue: queueItem, agent, startedAt: now, runnerId: this.runnerId });
      agentRunId = run.id ?? null;

      const execResult = await this.executor.execute(queueItem, agent);

      if (execResult.status === "succeeded") {
        await this.adapter.markQueueItemResult(queueItem.id, {
          status: "succeeded",
          output: execResult.output ?? null,
          finishedAt: Date.now(),
        });

        await this.adapter.completeAgentRun(run.id!, {
          status: "succeeded",
          output: execResult.output ?? null,
          usage: {
            promptTokens: (execResult.usage?.promptTokens ?? run.usage?.promptTokens) || 0,
            completionTokens: (execResult.usage?.completionTokens ?? run.usage?.completionTokens) || 0,
            totalTokens: (execResult.usage?.totalTokens ?? run.usage?.totalTokens) || 0,
            costUsd: (execResult.usage?.costUsd ?? run.usage?.costUsd) || 0,
          },
          error: null,
          timing: { ...run.timing, endedAt: Date.now(), durationMs: Date.now() - (run.timing?.startedAt ?? now) },
        });

        await this.adapter.recordSystemEvent({
          workspaceId: agent.workspaceId,
          type: "agent_run_succeeded",
          status: "ok",
          data: { queueId: queueItem.id, agentRunId: run.id, agentInstanceId: agent.id },
          createdAt: Date.now(),
        });

        return { status: "succeeded", queueId: queueItem.id, runId: run.id! };
      }

      // failed path
      await this.adapter.markQueueItemResult(queueItem.id, {
        status: "failed",
        error: { code: execResult.error?.code, message: execResult.error?.message ?? "execution failed" },
        finishedAt: Date.now(),
        attempts: queueItem.attempts + 1,
        maxAttempts: queueItem.maxAttempts,
      });

      await this.adapter.completeAgentRun(run.id!, {
        status: "failed",
        error: execResult.error ?? { message: "execution failed" },
        usage: {
          promptTokens: (execResult.usage?.promptTokens ?? run.usage?.promptTokens) || 0,
          completionTokens: (execResult.usage?.completionTokens ?? run.usage?.completionTokens) || 0,
          totalTokens: (execResult.usage?.totalTokens ?? run.usage?.totalTokens) || 0,
          costUsd: (execResult.usage?.costUsd ?? run.usage?.costUsd) || 0,
        },
        timing: { ...run.timing, endedAt: Date.now(), durationMs: Date.now() - (run.timing?.startedAt ?? now) },
      });

      await this.adapter.recordSystemEvent({
        workspaceId: agent.workspaceId,
        type: "agent_run_failed",
        status: "failed",
        data: { queueId: queueItem.id, agentRunId: run.id, agentInstanceId: agent.id, error: execResult.error },
        createdAt: Date.now(),
      });

      return { status: "failed", queueId: queueItem.id, runId: run.id!, error: new Error(execResult.error?.message ?? "execution failed") };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      await this.adapter.markQueueItemResult(queueItem.id, {
        status: "failed",
        error: { message: error.message },
        finishedAt: Date.now(),
        attempts: queueItem.attempts + 1,
        maxAttempts: queueItem.maxAttempts,
      });

      if (agentRunId) {
        await this.adapter.completeAgentRun(agentRunId, {
          status: "failed",
          error: { message: error.message, stack: error.stack },
          timing: { startedAt: now, endedAt: Date.now(), durationMs: Date.now() - now },
        });
      }

      await this.adapter.recordErrorReport({
        workspaceId: queueItem.workspaceId,
        environment: "dev",
        source: "server",
        message: error.message,
        stack: error.stack ?? null,
        context: { queueId: queueItem.id, runnerId: this.runnerId },
        severity: "error",
        createdAt: Date.now(),
      });

      return { status: "failed", queueId: queueItem.id, runId: agentRunId, error };
    } finally {
      await this.adapter.releaseLock(queueItem.id, this.runnerId);
    }
  }

  private async failQueue(queueItem: AgentQueueItem, now: number, code: string) {
    if (!queueItem.id) return;
    await this.adapter.markQueueItemResult(queueItem.id, {
      status: "failed",
      error: { code, message: code },
      finishedAt: now,
      attempts: queueItem.attempts + 1,
      maxAttempts: queueItem.maxAttempts,
    });
  }
}

export function createInMemoryExecutor(): AgentExecutor {
  return {
    async execute(job, agent) {
      return {
        status: "failed",
        error: { message: "Agent execution not wired", code: "not_implemented" },
        output: null,
        usage: null,
        steps: [
          {
            order: 0,
            type: "decision",
            name: "noop",
            data: { reason: "not implemented", jobId: job.id, agentId: agent.id },
          },
        ],
      };
    },
  };
}
