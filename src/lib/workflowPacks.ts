// src/lib/workflowPacks.ts

export type WorkflowPackTier = "basic" | "advanced" | "enterprise";

export interface WorkflowPack {
  key: string;
  name: string;
  description: string;
  tier: WorkflowPackTier;
  priceMonthly: number;
  priceId: string;
  workflows: string[];
}

export const WORKFLOW_PACKS: WorkflowPack[] = [
  {
    key: "basic_pack",
    name: "Basic Workflow Pack",
    description: "Includes essential automations like 'Zero Follow-Up Leak' and 'Instant Invoice on Job Complete'.",
    tier: "basic",
    priceMonthly: 99,
    priceId: process.env.STRIPE_PRICE_BASIC_PACK || "price_basic_pack", // set from Stripe env
    workflows: [
      "zero_followup_leak",
      "instant_invoice_on_job_complete",
    ],
  },
  {
    key: "advanced_pack",
    name: "Advanced Workflow Pack",
    description: "Includes advanced automations like 'No-Show Recovery System' and 'Price Protection Engine'.",
    tier: "advanced",
    priceMonthly: 299,
    priceId: process.env.STRIPE_PRICE_ADVANCED_PACK || "price_advanced_pack",
    workflows: [
      "no_show_recovery_system",
      "price_protection_engine",
    ],
  },
  {
    key: "enterprise_pack",
    name: "Enterprise Workflow Pack",
    description: "Includes all advanced automations plus 'Installer Load Balancer' and custom workflows.",
    tier: "enterprise",
    priceMonthly: 499,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE_PACK || "price_enterprise_pack",
    workflows: [
      "installer_load_balancer",
      "custom_workflows",
    ],
  },
];

export function getWorkflowPackByKey(key: string): WorkflowPack | undefined {
  return WORKFLOW_PACKS.find((pack) => pack.key === key);
}
