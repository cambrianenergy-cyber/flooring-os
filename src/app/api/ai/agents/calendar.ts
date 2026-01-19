// src/app/api/ai/agents/calendar.ts

// Agent registry for frontend listing
export const calendarAgentMeta = {
  id: 'calendar',
  label: 'Calendar Integration',
  description: 'Reads and writes to your business calendar for installs, measures, and follow-ups.'
};

interface CalendarInput {
  userRole: string;
  action: 'read' | 'write';
  eventType?: 'install' | 'measure' | 'followup';
  eventDetails?: any;
}

export function calendarAgent({ userRole, action, eventType, eventDetails }: CalendarInput) {
  if (!['manager', 'owner', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to access the calendar.' };
  }

  // Wire up AI usage metering
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "workflow_step",
      tokens: 40, // Estimate for calendar response
      model: null,
      entityType: "calendar",
      entityId: eventType || null,
    });
  });

  if (action === 'read') {
    // Example: return dummy calendar events
    return {
      text: `Upcoming ${eventType || 'all'} events:`,
      events: [
        { type: 'install', date: '2025-12-31T10:00:00', location: '123 Main St' },
        { type: 'measure', date: '2026-01-02T14:00:00', location: '456 Oak Ave' },
      ],
      actions: [
        { label: 'View in Google Calendar' },
        { label: 'Sync Events' },
      ],
    };
  } else if (action === 'write') {
    // Example: confirm event creation
    return {
      text: `Event created: ${eventType} on ${eventDetails?.date || 'TBD'}`,
      actions: [
        { label: 'View in Calendar' },
        { label: 'Edit Event' },
      ],
      event: eventDetails,
    };
  }
  return { error: 'Invalid action for calendar agent.' };
}
