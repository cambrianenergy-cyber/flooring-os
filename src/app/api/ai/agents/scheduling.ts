// src/app/api/ai/agents/scheduling.ts

// Agent registry for frontend listing
export const schedulingAgentMeta = {
  id: 'scheduling',
  label: 'Scheduling',
  description: 'Suggests and books appointments, installs, and syncs with business calendars.'
};

interface SchedulingInput {
  userRole: string;
  type: 'appointment' | 'install' | 'measure';
  preferredDate?: string;
  durationMinutes?: number;
  calendar?: string;
}

export function schedulingAgent({ userRole, type, preferredDate, durationMinutes = 60, calendar }: SchedulingInput) {
  if (!['rep', 'manager', 'owner', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to schedule.' };
  }

  // Wire up AI usage metering
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "workflow_step",
      tokens: 35, // Estimate for scheduling response
      model: null,
      entityType: "scheduling",
      entityId: type,
    });
  });

  // Example: suggest a time slot
  const now = new Date();
  const suggested = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
  return {
    text: `Suggested ${type} time: ${preferredDate || suggested.toLocaleString()} (${durationMinutes} min)`,
    actions: [
      { label: 'Book Appointment' },
      { label: 'Sync with Calendar' },
    ],
    details: {
      type,
      date: preferredDate || suggested.toISOString(),
      durationMinutes,
      calendar: calendar || 'default',
    },
  };
}
