// src/app/api/ai/workflowRunner.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAgentExecutor } from '@/lib/agentExecutors';

// Example: steps = [{ agentType: 'estimator', input: {...} }, ...]
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { workflowRunId, steps, workspaceId } = req.body;
  if (!workflowRunId || !Array.isArray(steps) || !workspaceId) {
    return res.status(400).json({ error: 'Missing workflowRunId, steps, or workspaceId' });
  }
  const runRef = adminDb().collection('workspaces').doc(workspaceId).collection('workflow_runs').doc(workflowRunId);
  // Write initial running state
  await runRef.set({ status: 'running', updatedAt: new Date(), lastHeartbeatAt: new Date(), stepCursor: 0 }, { merge: true });
  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await runRef.set({ stepCursor: i, lastStepStartedAt: new Date(), updatedAt: new Date() }, { merge: true });
      const agentFn = getAgentExecutor(step.agentType);
      let result;
      try {
        result = await agentFn({
          workspaceId,
          instruction: step.instruction || '',
          context: step.input || {},
          stepIndex: i,
          stepId: step.stepId || String(i),
        });
      } catch (err: any) {
        await runRef.set({ status: 'failed', error: { message: err.message, stack: err.stack }, updatedAt: new Date(), failedStep: i }, { merge: true });
        return res.status(500).json({ error: err.message, step: i });
      }
      await runRef.collection('step_results').doc(String(i)).set({ result, completedAt: new Date() });
    }
    await runRef.set({ status: 'completed', updatedAt: new Date(), completedAt: new Date() }, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    await runRef.set({ status: 'failed', error: { message: err.message, stack: err.stack }, updatedAt: new Date() }, { merge: true });
    return res.status(500).json({ error: err.message });
  }
}
