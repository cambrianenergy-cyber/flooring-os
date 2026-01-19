import { PREMIUM_PACKS } from "./premiumPacks";
import { WORKFLOW_PACKS, WorkflowPack } from "./workflowPacks";

export function getAllWorkflowPacks(): WorkflowPack[] {
  return [...WORKFLOW_PACKS, ...PREMIUM_PACKS];
}
