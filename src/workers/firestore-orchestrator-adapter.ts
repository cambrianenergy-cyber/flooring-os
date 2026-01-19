// Firestore implementation of the OrchestratorAdapter contract
import { getFirestore } from "firebase-admin/firestore";
import type { OrchestratorAdapter } from "./orchestrator";
import type {
  AgentInstance,
  AgentInstancePermission,
  AgentInstanceRun,
  AgentQueueItem,
  Entitlement,
  ErrorReport,
  SystemEvent,
} from "../lib/types";

export class FirestoreOrchestratorAdapter implements OrchestratorAdapter {
  private readonly db = getFirestore();

  async fetchNextQueueItem(now: number): Promise<AgentQueueItem | null> {
    // Find highest-priority queued item whose scheduledAt <= now
    const snapshot = await this.db
      .collection("agent_queues")
      .where("status", "==", "queued")
      .where("scheduledAt", "<=", now)
      .orderBy("scheduledAt", "asc")
      .orderBy("priority", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AgentQueueItem;
  }

  async lockQueueItem(queueId: string, runnerId: string, now: number): Promise<boolean> {
    const lockExpiryMs = 300_000; // 5 minutes
    const docRef = this.db.collection("agent_queues").doc(queueId);

    try {
      await this.db.runTransaction(async (txn) => {
        const doc = await txn.get(docRef);
        if (!doc.exists) throw new Error("Queue item not found");

        const data = doc.data()!;
        // Only lock if still queued and not already locked by another runner
        if (data.status !== "queued") {
          throw new Error("Already locked or processed");
        }
        if (data.lockedBy && data.lockedBy !== runnerId && data.lockedAt && data.lockedAt > now - lockExpiryMs) {
          throw new Error("Locked by another runner");
        }

        txn.update(docRef, {
          status: "locked",
          lockedBy: runnerId,
          lockedAt: now,
          updatedAt: now,
        });
      });
      return true;
    } catch {
      // Lock contention or item already processed
      return false;
    }
  }

  async markQueueItemRunning(queueId: string, runnerId: string, now: number): Promise<void> {
    await this.db
      .collection("agent_queues")
      .doc(queueId)
      .update({
        status: "running",
        lockedBy: runnerId,
        updatedAt: now,
      });
  }

  async markQueueItemResult(
    queueId: string,
    result:
      | { status: "succeeded"; output: Record<string, unknown> | null; finishedAt: number }
      | { status: "failed"; error: { code?: string; message: string }; finishedAt: number; attempts: number; maxAttempts: number }
  ): Promise<void> {
    const docRef = this.db.collection("agent_queues").doc(queueId);

    if (result.status === "succeeded") {
      await docRef.update({
        status: "succeeded",
        lockedBy: null,
        lockedAt: null,
        updatedAt: result.finishedAt,
      });
    } else {
      const shouldRetry = result.attempts < result.maxAttempts;
      const nextStatus = shouldRetry ? "queued" : "failed";
      const backoffMs = Math.min(60_000, 1000 * Math.pow(2, result.attempts)); // exponential backoff, max 60s

      await docRef.update({
        status: nextStatus,
        lastError: result.error,
        attempts: result.attempts,
        scheduledAt: shouldRetry ? result.finishedAt + backoffMs : result.finishedAt,
        lockedBy: null,
        lockedAt: null,
        updatedAt: result.finishedAt,
      });
    }
  }

  async releaseLock(queueId: string, runnerId: string): Promise<void> {
    const docRef = this.db.collection("agent_queues").doc(queueId);
    const doc = await docRef.get();
    if (doc.exists && doc.data()?.lockedBy === runnerId) {
      await docRef.update({
        status: "queued",
        lockedBy: null,
        lockedAt: null,
        updatedAt: Date.now(),
      });
    }
  }

  async loadAgentInstance(agentInstanceId: string): Promise<AgentInstance | null> {
    const doc = await this.db.collection("agent_instances").doc(agentInstanceId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as AgentInstance;
  }

  async loadAgentPermissions(agentInstanceId: string): Promise<AgentInstancePermission | null> {
    // Query for permissions by agentInstanceId
    const snapshot = await this.db
      .collection("agent_permissions")
      .where("agentInstanceId", "==", agentInstanceId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AgentInstancePermission;
  }

  async loadEntitlements(workspaceId: string): Promise<Entitlement | null> {
    const snapshot = await this.db
      .collection("entitlements")
      .where("workspaceId", "==", workspaceId)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Entitlement;
  }

  async createAgentRun(params: {
    queue: AgentQueueItem;
    agent: AgentInstance;
    startedAt: number;
    runnerId: string;
  }): Promise<AgentInstanceRun> {
    const { queue, agent, startedAt } = params;

    const run: Omit<AgentInstanceRun, "id"> = {
      workspaceId: agent.workspaceId,
      agentInstanceId: agent.id!,
      source: "system",
      sourceRef: { type: "queue", id: queue.id! },
      input: queue.payload,
      output: null,
      status: "running",
      timing: { startedAt, endedAt: null, durationMs: null },
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
      error: null,
      createdAt: startedAt,
      updatedAt: startedAt,
    };

    const docRef = await this.db.collection("agent_runs").add(run);
    return { id: docRef.id, ...run } as AgentInstanceRun;
  }

  async completeAgentRun(runId: string, updates: Partial<AgentInstanceRun>): Promise<void> {
    await this.db
      .collection("agent_runs")
      .doc(runId)
      .update({
        ...updates,
        updatedAt: Date.now(),
      });
  }

  async recordSystemEvent(event: {
    workspaceId?: string;
    type: string;
    status: "ok" | "failed";
    data: Record<string, unknown>;
    createdAt: number;
  }): Promise<void> {
    const doc: Omit<SystemEvent, "id"> = {
      workspaceId: event.workspaceId,
      type: event.type,
      status: event.status,
      data: event.data,
      createdAt: event.createdAt,
      updatedAt: event.createdAt,
    };

    await this.db.collection("system_events").add(doc);
  }

  async recordErrorReport(error: {
    workspaceId?: string;
    environment: "dev" | "staging" | "prod";
    source: "client" | "server" | "agent" | "workflow" | "webhook";
    message: string;
    stack: string | null;
    context: Record<string, unknown>;
    severity: "info" | "warn" | "error" | "critical";
    createdAt: number;
  }): Promise<void> {
    const doc: Omit<ErrorReport, "id"> = {
      workspaceId: error.workspaceId,
      environment: error.environment,
      source: error.source,
      message: error.message,
      stack: error.stack,
      context: error.context,
      severity: error.severity,
      createdAt: error.createdAt,
      updatedAt: error.createdAt,
    };

    await this.db.collection("error_reports").add(doc);
  }
}
