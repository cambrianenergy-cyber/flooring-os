// Agent registry for frontend listing
export const followUpAgentMeta = {
  id: 'followUp',
  label: 'Follow-Up',
  description: 'Drafts follow-up messages for customers via SMS or email after an estimate.'
};
// src/app/api/ai/agents/followUp.ts

interface FollowUpInput {
  customerName: string;
  estimateId?: string;
  preferredMethod?: 'sms' | 'email';
  userRole: string;
}

export function followUpAgent({ customerName, estimateId, preferredMethod = 'sms', userRole }: FollowUpInput) {
  // Permission check: only allow if userRole is allowed
  if (!['rep', 'manager', 'owner'].includes(userRole)) {
    return { error: "You do not have permission to send follow-ups." };
  }

  const message = `Hi ${customerName}, just following up on your recent estimate${estimateId ? ' #' + estimateId : ''}. Let us know if you have any questions or are ready to move forward!`;

  return {
    text: `Here's a follow-up message you can send via ${preferredMethod.toUpperCase()}:\n${message}`,
    actions: [
      { label: preferredMethod === 'sms' ? 'Send Follow-Up Text' : 'Send Email' },
      { label: 'Edit Message' },
    ],
    message,
  };
}
