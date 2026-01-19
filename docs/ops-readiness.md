# Ops Readiness: Agents & Workflows

- **Env separation**: set `APP_ENV` (dev/staging/prod). API checks `x-env` header against `APP_ENV` to block cross-env calls.
- **Kill switch**: set `AGENT_KILL_SWITCH=true` to immediately disable agent execution.
- **API guard**: set `AGENT_API_KEY` and send `x-agent-api-key` header; requests without it are rejected.
- **Rate limiting**: AI orchestrator enforces 30 req/min per workspace/IP (in-memory token bucket) to prevent runaway calls.
- **Permissions**: Agent dispatch checks `agent_permissions` (scope and optional allowedCollections), plan gating, role gating, and workspaceId.
- **Logging**: agent_runs, agent_logs, workflow_failures capture outcomes; audit logs on key actions (extend as needed).
- **Backups & recovery**: run scheduled Firestore exports (not automated here); verify `agent_runs`, `workflow_runs`, `workflow_failures`, and `audit_logs` are included; document restore runbook.
- **Runaway protection**: orchestrator retries maxAttempts=2; add lower limits per agent if needed.
- **Deployment reminder**: after rule changes, deploy `firestore.rules` and restart services to pick up env vars.
