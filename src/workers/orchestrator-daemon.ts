#!/usr/bin/env node
// Orchestrator daemon: continuously polls agent_queues and executes agents
// Usage:
//   In development: tsx src/workers/orchestrator-daemon.ts
//   In production: node dist/workers/orchestrator-daemon.js (after build)

import * as admin from "firebase-admin";
import { Orchestrator } from "./orchestrator";
import { FirestoreOrchestratorAdapter } from "./firestore-orchestrator-adapter";
import { createAgentExecutor } from "./agent-executor";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const adapter = new FirestoreOrchestratorAdapter();
const executor = createAgentExecutor(); // Uses mock in test, real LLM in prod when wired

const orchestrator = new Orchestrator(adapter, executor, {
  pollIntervalMs: parseInt(process.env.ORCHESTRATOR_POLL_MS || "2000", 10),
  runnerId: process.env.ORCHESTRATOR_RUNNER_ID || `orchestrator-${process.pid}`,
});

// Graceful shutdown
const shutdown = () => {
  console.log("[Orchestrator] Shutting down gracefully...");
  orchestrator.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the orchestrator
console.log("[Orchestrator] Starting orchestrator daemon...");
console.log(`[Orchestrator] Runner ID: ${process.env.ORCHESTRATOR_RUNNER_ID || `orchestrator-${process.pid}`}`);
console.log(`[Orchestrator] Poll interval: ${process.env.ORCHESTRATOR_POLL_MS || "2000"}ms`);

orchestrator.start();

console.log("[Orchestrator] Daemon running. Press Ctrl+C to stop.");
