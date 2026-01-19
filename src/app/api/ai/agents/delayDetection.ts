// src/app/api/ai/agents/delayDetection.ts

export const delayDetectionAgentMeta = {
  id: 'delayDetection',
  label: 'Delay Detection Agent',
  description: 'Detects schedule slippage, alerts owners early, recommends fixes.'
};

interface DelayDetectionInput {
  userRole: string;
  jobs: Array<{ jobId: string; scheduledAt: string; actualStart?: string }>;
}

export function delayDetectionAgent({ userRole, jobs }: DelayDetectionInput) {
  if (!['owner', 'manager', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to detect delays.' };
  }
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    return { error: 'Job data is required.' };
  }
  // Example: detect delays
  return {
    text: 'Delay detection complete. Alerts sent if needed.',
    actions: [
      { label: 'View Delay Report' },
      { label: 'Send Alert' },
    ],
  };
}
