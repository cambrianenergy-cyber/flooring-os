// src/app/api/ai/agents/reminders.ts

// Agent registry for frontend listing
export const remindersAgentMeta = {
  id: 'reminders',
  label: 'Task Reminders',
  description: 'Creates and sends reminders for jobs, follow-ups, or material orders.'
};

interface RemindersInput {
  userRole: string;
  taskType: 'job' | 'followup' | 'material';
  dueDate?: string;
  details?: string;
}

export function remindersAgent({ userRole, taskType, dueDate, details }: RemindersInput) {
  if (!['rep', 'manager', 'owner', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to create reminders.' };
  }
  if (!taskType) {
    return { error: 'Task type is required for reminders.' };
  }

  // Wire up AI usage metering
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "workflow_step",
      tokens: 30, // Estimate for reminder response
      model: null,
      entityType: "reminder",
      entityId: taskType,
    });
  });

  // Example: create a reminder
  return {
    text: `Reminder set for ${taskType} on ${dueDate || 'TBD'}${details ? ': ' + details : ''}`,
    actions: [
      { label: 'Send Reminder' },
      { label: 'Edit Reminder' },
    ],
    reminder: {
      type: taskType,
      dueDate: dueDate || null,
      details: details || '',
    },
  };
}
