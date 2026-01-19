// src/app/api/ai/agents/marginGuard.ts

export const marginGuardAgentMeta = {
  id: 'marginGuard',
  label: 'Margin Guard Agent',
  description: 'Flags thin-margin jobs, detects labor/material imbalance, recommends corrections before sending.'
};

interface MarginGuardInput {
  userRole: string;
  jobData: Record<string, any>;
}

export function marginGuardAgent({ userRole, jobData }: MarginGuardInput) {
  if (!['owner', 'manager', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to guard margin.' };
  }
  if (!jobData) {
    return { error: 'Job data is required.' };
  }
  // Example: flag margin issues
  const marginStatus = {
    margin: 'thin',
    laborImbalance: true,
    materialImbalance: false,
    recommendation: 'Increase labor rate or reduce material cost.'
  };
  return {
    text: 'Margin analysis complete.',
    marginStatus,
    actions: [
      { label: 'Apply Correction' },
      { label: 'Review Details' },
    ],
  };
}
