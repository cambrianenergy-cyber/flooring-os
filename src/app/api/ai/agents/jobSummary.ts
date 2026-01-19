// Agent registry for frontend listing
export const jobSummaryAgentMeta = {
  id: 'jobSummary',
  label: 'Job Summary',
  description: 'Summarizes a job, listing rooms, status, and a checklist of next steps.'
};
// src/app/api/ai/agents/jobSummary.ts

interface JobSummaryInput {
  jobName: string;
  rooms: string[];
  status: string;
  userRole: string;
}

export function jobSummaryAgent({ jobName, rooms, status, userRole }: JobSummaryInput) {
  // Permission check: only allow if userRole is allowed
  if (!['manager', 'owner'].includes(userRole)) {
    return { error: "You do not have permission to view job summaries." };
  }

  // Wire up AI usage metering
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "workflow_step",
      tokens: 60, // Estimate for job summary response
      model: null,
      entityType: "job_summary",
      entityId: jobName,
    });
  });

  const checklist = [
    "Verify measurements",
    "Confirm product selections",
    "Schedule installation",
    "Order materials",
    "Send customer confirmation",
  ];

  return {
    text: `Job Summary for ${jobName}:\nRooms: ${rooms.join(", ")}\nStatus: ${status}\nChecklist:`,
    checklist,
    actions: [
      { label: "Summarize Job" },
      { label: "Generate Checklist" },
    ],
  };
}
