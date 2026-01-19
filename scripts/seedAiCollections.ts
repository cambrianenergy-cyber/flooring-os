import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = Date.now();

async function seedAgentRuns() {
  const runs = [
    {
      id: "run_demo_1",
      workspaceId: "ws_demo",
      agentId: "agent_sales_1",
      taskId: null,
      triggerType: "user",
      triggerContext: { userRole: "manager" },
      status: "succeeded",
      startedAt: now - 5000,
      finishedAt: now,
      durationMs: 5000,
      input: { instruction: "Draft follow-up", context: {} },
      output: { message: "Follow-up drafted." },
      error: null,
      tokensIn: 512,
      tokensOut: 256,
      usdCost: 0.04,
      model: "gpt-4o",
      correlationId: "corr_run_demo_1",
      createdAt: now - 5000,
      updatedAt: now,
    },
    {
      id: "run_demo_2",
      workspaceId: "ws_demo",
      agentId: "agent_ops_1",
      taskId: "task_demo_1",
      triggerType: "workflow",
      triggerContext: { workflowId: "wf_daily_sync" },
      status: "failed",
      startedAt: now - 8000,
      finishedAt: now - 3000,
      durationMs: 5000,
      input: { instruction: "Sync inventory" },
      output: null,
      error: { message: "Timeout", stack: null, retriable: false },
      tokensIn: 200,
      tokensOut: 50,
      usdCost: 0.01,
      model: "gpt-4o-mini",
      correlationId: "corr_run_demo_2",
      createdAt: now - 8000,
      updatedAt: now - 3000,
    },
  ];

  for (const run of runs) {
    await setDoc(doc(collection(db, "agent_runs"), run.id), run);
  }
}

async function seedAgentPermissions() {
  const perms = [
    {
      id: "perm_email_lead_987",
      workspaceId: "ws_demo",
      agentId: "agent_sales_1",
      toolKey: "send_email",
      scope: "lead",
      scopeId: "lead_987",
      allowed: true,
      expiresAt: null,
      grantedByUserId: "user_owner",
      revokedAt: null,
      conditions: { allowedCollections: ["leads", "contacts"] },
      notes: "Restricted to lead 987",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "perm_workspace_ops",
      workspaceId: "ws_demo",
      agentId: "agent_ops_1",
      toolKey: "sync_inventory",
      scope: "workspace",
      scopeId: null,
      allowed: true,
      expiresAt: null,
      grantedByUserId: "user_admin",
      revokedAt: null,
      conditions: null,
      notes: "Workspace-wide ops permissions",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const perm of perms) {
    await setDoc(doc(collection(db, "agent_permissions"), perm.id), perm);
  }
}

async function seedAgentTasks() {
  const tasks = [
    {
      id: "task_demo_1",
      workspaceId: "ws_demo",
      createdByUserId: "user_owner",
      source: "user",
      status: "queued",
      priority: "normal",
      agentId: "agent_sales_1",
      agentType: "sales.follow_up",
      context: { leadId: "lead_987" },
      input: { message: "Follow up" },
      tokensIn: 0,
      tokensOut: 0,
      usdEstimate: 0.02,
      attempts: 0,
      maxAttempts: 3,
      jobId: null,
      leadId: "lead_987",
      estimateId: null,
      contactId: null,
      roomId: null,
      output: null,
      error: null,
      code: null,
      message: null,
      stack: null,
      cost: {},
      lockedBy: null,
      lockedAt: null,
      startedAt: null,
      finishedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "task_demo_2",
      workspaceId: "ws_demo",
      createdByUserId: "user_admin",
      source: "workflow",
      status: "running",
      priority: "high",
      agentId: "agent_ops_1",
      agentType: "ops.sync",
      context: { workflowId: "wf_daily_sync" },
      input: { action: "sync" },
      tokensIn: 120,
      tokensOut: 40,
      usdEstimate: 0.01,
      attempts: 1,
      maxAttempts: 3,
      jobId: null,
      leadId: null,
      estimateId: null,
      contactId: null,
      roomId: null,
      output: null,
      error: null,
      code: null,
      message: null,
      stack: null,
      cost: {},
      lockedBy: "runner_1",
      lockedAt: now - 1000,
      startedAt: now - 2000,
      finishedAt: null,
      createdAt: now - 2000,
      updatedAt: now - 1000,
    },
  ];

  for (const task of tasks) {
    await setDoc(doc(collection(db, "agent_tasks"), task.id), task);
  }
}

async function main() {
  await seedAgentRuns();
  await seedAgentPermissions();
  await seedAgentTasks();
  console.log("Seeded agent_runs, agent_permissions, agent_tasks for ws_demo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
