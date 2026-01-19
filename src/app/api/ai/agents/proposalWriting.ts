// src/app/api/ai/agents/proposalWriting.ts

export const proposalWritingAgentMeta = {
  id: 'proposalWriting',
  label: 'Proposal Writing Agent',
  description: 'Writes professional proposals, adjusts tone, and rewrites objections automatically.'
};

interface ProposalWritingInput {
  userRole: string;
  customerName: string;
  jobDetails: string;
  tone?: 'premium' | 'budget';
  objections?: string[];
}

export function proposalWritingAgent({ userRole, customerName, jobDetails, tone = 'premium', objections = [] }: ProposalWritingInput) {
  if (!['owner', 'manager', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to write proposals.' };
  }
  if (!customerName || !jobDetails) {
    return { error: 'Customer name and job details are required.' };
  }
  let proposal = `Dear ${customerName},\n\nWe are pleased to present your proposal for: ${jobDetails}.`;
  proposal += `\n\nThis proposal is tailored for a ${tone === 'premium' ? 'premium' : 'budget'} experience.`;
  if (objections.length > 0) {
    proposal += `\n\nWe have addressed your concerns: ` + objections.map(obj => `\n- ${obj}: Our response...`).join('');
  }
  proposal += '\n\nThank you for considering us!';
  return {
    text: 'Proposal generated:',
    proposal,
    actions: [
      { label: 'Download Proposal' },
      { label: 'Send to Customer' },
    ],
  };
}
