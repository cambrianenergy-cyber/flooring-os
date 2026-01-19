import { doc, getDoc, setDoc, serverTimestamp, runTransaction, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AgentTaskStatus = "queued" | "running" | "success" | "failed" | "cancelled";

export interface AgentTask {
  id: string;
  payload: any;
  status: AgentTaskStatus;
  lockedBy?: string;
  lockedAt?: Date;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

const TASKS_COLLECTION = "agent_tasks";

export async function claimAgentTask(workerId: string) {
  // Atomically claim a queued, unlocked task
  const taskRef = doc(db, TASKS_COLLECTION, "next"); // Replace with query for next queued task
  return await runTransaction(db, async (transaction) => {
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists()) return null;
    const task = taskSnap.data() as AgentTask;
    if (task.status !== "queued" || task.lockedBy) return null;
    transaction.update(taskRef, {
      status: "running",
      lockedBy: workerId,
      lockedAt: serverTimestamp(),
      attempts: (task.attempts || 0) + 1,
      updatedAt: serverTimestamp(),
    });
    return { ...task, id: taskSnap.id };
  });
}

export async function releaseAgentTask(taskId: string, status: AgentTaskStatus, result?: any, error?: string) {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(taskRef, {
    status,
    result: result || null,
    lastError: error || null,
    lockedBy: null,
    lockedAt: null,
    updatedAt: serverTimestamp(),
  });
}

export async function retryAgentTask(taskId: string, attempts: number, maxAttempts: number) {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  if (attempts < maxAttempts) {
    // Exponential backoff: e.g., 2^attempts seconds
    const delay = Math.pow(2, attempts) * 1000;
    setTimeout(async () => {
      await updateDoc(taskRef, {
        status: "queued",
        lockedBy: null,
        lockedAt: null,
        updatedAt: serverTimestamp(),
      });
    }, delay);
  } else {
    await updateDoc(taskRef, {
      status: "failed",
      updatedAt: serverTimestamp(),
    });
  }
}
