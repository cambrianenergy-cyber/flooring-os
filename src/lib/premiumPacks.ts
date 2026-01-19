import { WorkflowPack } from "./workflowPacks";

export const PREMIUM_PACKS: WorkflowPack[] = [
  {
    key: "growth_command_pack",
    name: "Growth Command Pack",
    description: "Market Expansion Agent, Hiring Readiness Agent, Multi-Location Optimizer (Premium/Elite Only, Coming Soon)",
    tier: "enterprise",
    priceMonthly: 499,
    priceId: "price_growth_command_pack",
    workflows: [],
  },
  {
    key: "competitive_intelligence_pack",
    name: "Competitive Intelligence Pack",
    description: "Competitor Pricing Monitor, Market Positioning Agent, Win/Loss Pattern Analyzer (Premium/Elite Only, Coming Soon)",
    tier: "enterprise",
    priceMonthly: 349,
    priceId: "price_competitive_intelligence_pack",
    workflows: [],
  },
];
