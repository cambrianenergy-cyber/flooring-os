# Reliability & Observability Plan

## What we need to see
- Why an agent failed (error details, tokens, model, correlationId)
- Why a workflow stalled (trigger, step, lock state, retries)
- Who triggered what (audit trail)
- When critical actions happened (timestamps + status transitions)

## Collections to use
- `agent_runs`: status, trigger, model, tokens, error
- `agent_logs`: structured log lines per run (stepId/spanId)
- `workflow_failures`: durable records of workflow errors
- `workflow_triggers`: who/what fired a workflow
- `audit_logs`: who performed critical actions

## Enforcement (already wired)
- Firestore rules restrict all AI/workflow collections by workspace + role.
- API orchestrator gates AI execution by plan and role (owner|admin|manager).

## Implementation checklist
1) **Instrument AI agents**
   - On start: write `agent_runs` with status `running`, `triggerType`, `correlationId`.
   - On success/failure: update `agent_runs` status, tokens, model, error.
   - Per tool/step: append `agent_logs` with `level`, `message`, `stepId`, `payload`.

2) **Instrument workflow runner**
   - On trigger: write `workflow_triggers` with `source`, `eventKey`, `payload`.
   - On step error: write `workflow_failures` with `runId`, `stepId`, `message`, `retryAttempt`.
   - On stall/retry: log `workflow_failures` and surface in dashboard.

3) **Audit critical actions**
   - Use `logAuditEvent` for: send proposal/contract, delete job/document, schedule install/measure, change role.

4) **Health dashboard (MVP)**
   - Cards: today’s failed agent runs, open workflow failures, last trigger per workflow, last 10 audit events.
   - Alerts: count of `workflow_failures` status `open` > 0 or agent_runs.status `failed` in last 24h.

## Helpers added
- `src/lib/observability.ts`
  - `logAgentFailure(input: AgentLog)` → writes `agent_logs`
  - `logWorkflowFailure(input: WorkflowFailure)` → writes `workflow_failures`
  - `logAuditEvent(event)` → writes `audit_logs`

## Next steps to wire
- Call `logAgentFailure` and `logWorkflowFailure` from agent runner and workflow runner on error paths.
- Call `logAuditEvent` in API routes for destructive or customer-facing actions.
- Build a dashboard page querying the above collections with workspaceId filter and role guard.
