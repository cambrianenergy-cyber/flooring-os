// src/app/api/ai/agents/estimateComparator.ts

export const estimateComparatorAgentMeta = {
  id: 'estimateComparator',
  label: 'Estimate Comparator Agent',
  description: 'Compares estimates side-by-side, shows price vs close probability, learns from past wins/losses.'
};

interface EstimateComparatorInput {
  userRole: string;
  estimates: Array<{ price: number; probability: number; won: boolean }>;
}

export function estimateComparatorAgent({ userRole, estimates }: EstimateComparatorInput) {
  if (!['owner', 'manager', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to compare estimates.' };
  }
  if (!estimates || !Array.isArray(estimates) || estimates.length < 2) {
    return { error: 'At least two estimates are required.' };
  }
  // Example: compare estimates
  const comparison = estimates.map((e, i) => ({
    index: i + 1,
    price: e.price,
    probability: e.probability,
    won: e.won
  }));
  return {
    text: 'Estimates compared.',
    comparison,
    actions: [
      { label: 'View Comparison' },
      { label: 'Learn from Results' },
    ],
  };
}
