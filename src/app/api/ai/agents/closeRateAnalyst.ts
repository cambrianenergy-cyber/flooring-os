// src/app/api/ai/agents/closeRateAnalyst.ts

export const closeRateAnalystAgentMeta = {
  id: 'closeRateAnalyst',
  label: 'Close Rate Analyst',
  description: 'Tracks win/loss reasons, compares pricing vs close rate, identifies sales leaks.'
};

interface CloseRateAnalystInput {
  userRole: string;
  data: Array<{ price: number; won: boolean; reason?: string }>;
}

export function closeRateAnalystAgent({ userRole, data }: CloseRateAnalystInput) {
  if (!['owner', 'manager', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to analyze close rates.' };
  }
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { error: 'No data provided for analysis.' };
  }
  const total = data.length;
  const won = data.filter(d => d.won).length;
  const lost = total - won;
  const avgPrice = (data.reduce((sum, d) => sum + d.price, 0) / total).toFixed(2);
  const winReasons = data.filter(d => d.won && d.reason).map(d => d.reason);
  const lossReasons = data.filter(d => !d.won && d.reason).map(d => d.reason);
  return {
    text: `Close Rate Analysis:\nTotal: ${total}\nWon: ${won}\nLost: ${lost}\nAvg Price: $${avgPrice}\nWin Reasons: ${winReasons.join(', ') || 'N/A'}\nLoss Reasons: ${lossReasons.join(', ') || 'N/A'}`,
    actions: [
      { label: 'View Details' },
      { label: 'Export Report' },
    ],
  };
}
