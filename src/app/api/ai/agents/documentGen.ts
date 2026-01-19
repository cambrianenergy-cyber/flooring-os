// src/app/api/ai/agents/documentGen.ts

// Agent registry for frontend listing
export const documentGenAgentMeta = {
  id: 'documentGen',
  label: 'Document Generation',
  description: 'Auto-generates contracts, change orders, or customer emails from templates.'
};

interface DocumentGenInput {
  userRole: string;
  docType: 'contract' | 'changeOrder' | 'email';
  data: Record<string, any>;
}

export function documentGenAgent({ userRole, docType, data }: DocumentGenInput) {
  if (!['manager', 'owner', 'admin'].includes(userRole)) {
    return { error: 'You do not have permission to generate documents.' };
  }
  if (!docType || !data) {
    return { error: 'Document type and data are required.' };
  }

  // Wire up AI usage metering
  import("@/lib/metering").then(({ recordAiUsage }) => {
    recordAiUsage({
      workspaceId: "system", // Replace with actual workspaceId if available
      uid: null,
      kind: "workflow_step",
      tokens: 70, // Estimate for document generation
      model: null,
      entityType: "document",
      entityId: docType,
    });
  });

  // Example: generate a simple document preview
  let docText = '';
  if (docType === 'contract') {
    docText = `Contract for ${data.customerName || 'Customer'}\nJob: ${data.jobName || 'N/A'}\nTotal: $${data.total || '0.00'}`;
  } else if (docType === 'changeOrder') {
    docText = `Change Order for ${data.customerName || 'Customer'}\nChange: ${data.changeDescription || 'N/A'}\nAmount: $${data.amount || '0.00'}`;
  } else if (docType === 'email') {
    docText = `To: ${data.email || 'customer@example.com'}\nSubject: ${data.subject || 'Your Flooring Project'}\nBody: ${data.body || ''}`;
  }
  return {
    text: 'Document generated:',
    document: docText,
    actions: [
      { label: 'Download PDF' },
      { label: 'Send to Customer' },
    ],
    docType,
  };
}
