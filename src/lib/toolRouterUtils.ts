// Utility functions for the tool router
import { getFirestore } from 'firebase-admin/firestore';
import { checkPlanGate } from './planGateServer';

// Get tool config from Firestore
export async function getToolConfig(workspaceId: string, toolKey: string) {
  const db = getFirestore();
  const toolDoc = await db.collection('agent_tools')
    .where('workspaceId', '==', workspaceId)
    .where('key', '==', toolKey)
    .limit(1).get();
  if (toolDoc.empty) throw new Error('Tool not found');
  return toolDoc.docs[0].data();
}

// Execute the tool action (stub, expand as needed)
import type { PlanKey } from './plans';

export async function executeToolAction(
  toolKey: string,
  actionPayload: Record<string, unknown>,
  context: {
    planKey?: PlanKey;
    currentAgents?: number;
    currentWorkspaces?: number;
    currentWorkflowRunsThisMonth?: number;
  }
) {
  // Enforce backend plan gating for tool usage
  // context should include plan, current usage, and user info
  const { planKey, currentAgents = 0, currentWorkspaces = 0, currentWorkflowRunsThisMonth = 0 } = context;
  if (!planKey) {
    return { error: "Missing planKey in context" };
  }
  const gate = checkPlanGate({ planKey, currentAgents, currentWorkspaces, currentWorkflowRunsThisMonth, tool: toolKey as keyof import('./plans').PlanFeatures });
  if (!gate.allowed) {
    return { error: `Plan restriction: ${gate.reason}` };
  }
  // Example: route to internal functions based on toolKey
  switch (toolKey) {
    case 'create_document':
      // return await createDocument(actionPayload, context);
      return { message: 'Document created (stub)' };
    case 'send_email':
      // return await sendEmail(actionPayload, context);
      return { message: 'Email sent (stub)' };
    case 'update_job_status':
      // return await updateJobStatus(actionPayload, context);
      return { message: 'Job status updated (stub)' };
    case 'create_invoice':
      // return await createInvoice(actionPayload, context);
      return { message: 'Invoice created (stub)' };
    case 'apply_discount':
      // return await applyDiscount(actionPayload, context);
      return { message: 'Discount applied (stub)' };
    default:
      throw new Error('Unknown toolKey');
  }
}
