// src/app/api/ai/agents/leadScoring.ts

// Agent registry for frontend listing
export const leadScoringAgentMeta = {
  id: 'leadScoring',
  label: 'Lead Scoring',
  description: 'Analyzes leads and suggests which to prioritize based on likelihood to close.'
};

interface LeadScoringInput {
  userRole: string;
  leads: Array<{ name: string; source: string; lastContact: string; value: number; status: string }>;
}

export function leadScoringAgent({ userRole, leads }: LeadScoringInput) {
  if (!['manager', 'owner', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to score leads.' };
  }
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return { error: 'No leads provided for scoring.' };
  }
  // Example: score leads by recency, value, and status
  const scored = leads.map(lead => {
    let score = 0;
    if (lead.status === 'hot') score += 50;
    if (lead.value > 5000) score += 20;
    if (new Date(lead.lastContact) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) score += 20; // contacted in last week
    if (lead.source === 'referral') score += 10;
    return { ...lead, score };
  }).sort((a, b) => b.score - a.score);

  // Wire up AI usage metering
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "workflow_step",
      tokens: 80, // Estimate for lead scoring response
      model: null,
      entityType: "lead_scoring",
      entityId: null,
    });
  });

  return {
    text: 'Leads scored and prioritized:',
    leads: scored,
    actions: [
      { label: 'View Top Leads' },
      { label: 'Assign to Rep' },
    ],
  };
}
