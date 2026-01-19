/**
 * Workflow Model by Plan
 *
 * | Plan       | Workflows Available                       |
 * |------------|-------------------------------------------|
 * | Foundation | ❌ None                                   |
 * | Momentum   | ✅ Limited workflows (manual / semi-auto) |
 * | Command    | ✅ Full workflows (autonomous)            |
 * | Dominion   | ✅ Unlimited + custom workflows           |
 */

// src/app/api/ai/agents/trainingTips.ts

// Agent registry for frontend listing
export const trainingTipsAgentMeta = {
  id: 'trainingTips',
  label: 'User Training Tips',
  description: 'Provides onboarding, workflow tips, and contextual help to users via chat.'
};

interface TrainingTipsInput {
  userRole: string;
  topic?: string;
}

export function trainingTipsAgent({ userRole, topic }: TrainingTipsInput) {
  // All roles can access training tips
  const tips: Record<string, string> = {
    onboarding: 'Welcome! Start by adding your first product and setting up your team in Settings.',
    estimate: 'To build an estimate, select a product, measure the room, and add accessories as needed.',
    scheduling: 'Use the Scheduling agent to book appointments and sync with your calendar.',
    ai: 'The AI Home Screen lets you chat with specialized agents for estimates, follow-ups, and more.',
    default: 'Ask about any workflow or feature for a quick tip!'
  };
  const key = topic && tips[topic] ? topic : 'default';

  // Wire up AI usage metering
  // This is a simple example; in production, estimate tokens based on response length
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "chat",
      tokens: 50, // Estimate for a tip response
      model: null,
      entityType: "training_tip",
      entityId: key,
    });
  });

  return {
    text: tips[key],
    actions: [
      { label: 'Show More Tips' },
      { label: 'Contact Support' },
    ],
    topic: key,
  };
}
