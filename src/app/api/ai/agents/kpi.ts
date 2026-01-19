// src/app/api/ai/agents/kpi.ts

// Agent registry for frontend listing
export const kpiAgentMeta = {
  id: 'kpi',
  label: 'KPI Breakdown',
  description: 'Provides a KPI breakdown and performance analysis for jobs, reps, or the business.'
};

interface KPIInput {
  userRole: string;
  scope?: 'job' | 'rep' | 'business';
  data?: any;
}

export function kpiAgent({ userRole, scope = 'business', data }: KPIInput) {
  if (!['manager', 'owner'].includes(userRole)) {
    return { error: 'You do not have permission to view KPIs.' };
  }

  // Wire up AI usage metering
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "workflow_step",
      tokens: 50, // Estimate for KPI response
      model: null,
      entityType: "kpi",
      entityId: scope,
    });
  });

  // Example: return dummy KPI data
  const kpis = {
    job: { completed: 12, inProgress: 3, avgCloseRate: '78%' },
    rep: { topRep: 'Jane Doe', closeRate: '82%', jobs: 18 },
    business: { totalRevenue: '$1.2M', avgMargin: '32%', jobsYTD: 120 },
  };
  return {
    text: `KPI Breakdown for ${scope}:`,
    kpi: kpis[scope],
    actions: [
      { label: 'KPI Breakdown' },
      { label: 'View Pipeline' },
    ],
  };
}