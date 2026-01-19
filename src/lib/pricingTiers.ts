  /**
   * Utility: Check if subscription has Zero Lead Leak Pack add-on
   */
  export function hasZeroLeadLeakPack(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("zero-lead-leak-pack");
  }

  /**
   * Utility: Check if subscription has Instant Lead Response Pack add-on
   */
  export function hasInstantLeadResponsePack(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("instant-lead-response-pack");
  }

  /**
   * Utility: Check if subscription has Follow-Up Cadence Pack add-on
   */
  export function hasFollowUpCadencePack(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("follow-up-cadence-pack");
  }

  /**
   * Utility: Check if subscription has Dead Lead Recovery Pack add-on
   */
  export function hasDeadLeadRecoveryPack(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("dead-lead-recovery-pack");
  }
  /**
   * Utility: Check if subscription has Compliance Automation add-on
   */
  export function hasComplianceAutomation(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("compliance-automation-addon");
  }

  /**
   * Utility: Check if subscription has White-label Branding add-on
   */
  export function hasWhiteLabelBranding(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("white-label-branding-addon");
  }

  /**
   * Utility: Check if subscription has Multi-location Intelligence add-on
   */
  export function hasMultiLocationIntelligence(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("multi-location-intelligence-addon");
  }
  /**
   * Utility: Check if subscription has Workflow Automation add-on
   */
  export function hasWorkflowAutomation(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("workflow-automation-addon");
  }
  /**
   * Utility: Check if subscription has API Access add-on
   */
  export function hasApiAccess(sub: { activeAddOns?: string[], tier?: string }): boolean {
    return (sub.activeAddOns || []).includes("api-access-addon") || sub.tier === "infrastructure";
  }
/**
 * Pricing Tiers & Feature Pyramid
 * 
 * Enterprise-grade tier definitions with feature access control
 * Scales from 3 users (Core) → 25+ users (Enterprise)
 * 
 * Design Principle:
 * - Pricing grows with confidence, not fear
 * - No per-seat chaos (company-wide pricing)
 * - Founder gets unlimited (hard-coded)
 * - Features upgrade gracefully (show "unlock" not hide)
 */

/**
 * Tier Definitions
 */
export type TierLevel = "founder" | "essentials" | "professional" | "enterprise" | "infrastructure";

export interface TierDefinition {
  id: TierLevel;
  name: string;
  description: string;
  maxUsers: number;
  monthlyPrice: number; // USD
  yearlyPrice?: number;
  signal: string; // What this tier signals to market
  target: string; // Best for...
  displayName: string; // "Square Core", "Square Operations", etc.
}

export const TIER_DEFINITIONS: Record<TierLevel, TierDefinition> = {
  founder: {
    id: "founder",
    name: "Square Founder",
    displayName: "Square Founder",
    description: "Unlimited users, all features, no billing",
    maxUsers: Infinity,
    monthlyPrice: 0,
    signal: "This is the founders' exclusive tier",
    target: "Company founder (non-downgradable)",
  },

  essentials: {
    id: "essentials",
    name: "Square Essentials",
    displayName: "Square Essentials",
    description: "The Foundation - Full platform access for small teams",
    maxUsers: 5,
    monthlyPrice: 299,
    yearlyPrice: 3000,
    signal: "We're a real business, not a solo operator",
    target: "Small but serious teams (3–5 users)",
  },

  professional: {
    id: "professional",
    name: "Square Professional",
    displayName: "Square Professional",
    description: "The Backbone - Operational excellence for growing companies",
    maxUsers: 15,
    monthlyPrice: 699,
    yearlyPrice: 7000,
    signal: "We sell volume and manage multiple jobs simultaneously",
    target: "Growing companies, sales teams (5–15 users)",
  },

  enterprise: {
    id: "enterprise",
    name: "Square Enterprise",
    displayName: "Square Enterprise",
    description: "The Operating System - Replaces multiple internal tools",
    maxUsers: 25,
    monthlyPrice: 1299,
    yearlyPrice: 13000,
    signal: "This system replaces multiple internal tools",
    target: "Large flooring companies, regional operators (15–25 users)",
  },

  infrastructure: {
    id: "infrastructure",
    name: "Square Infrastructure",
    displayName: "Square Infrastructure",
    description: "The Replacement - Infrastructure, not software",
    maxUsers: Infinity,
    monthlyPrice: 2500, // Base; contract varies $2500–$5000
    signal: "This is infrastructure, replacing legacy systems",
    target: "National brands, franchises, distributors (25+ users)",
  },
};

/**
 * Tier Features Mapping
 * 
 * Which features are available in which tiers
 * Used to gate UI and determine billing
 */

export interface FeatureTierAccess {
  featureName: keyof FeatureAccessMatrix;
  minTier: TierLevel;
  upgradePrice?: number; // For add-ons (e.g., AI in Core)
}

export interface FeatureAccessMatrix {
  // Square Measure features
  squareMeasureCore: TierLevel;
  squareMeasureAdvanced: TierLevel;

  // Geometry & Layout
  assistedDraw: TierLevel;
  walkTheRoom: TierLevel;
  geometryEngine: TierLevel;
  snapToGrid: TierLevel;

  // Roll-Cut & Seam Planning
  rollCutOptimizer: TierLevel;
  seamPlanning: TierLevel;
  seamVisibilityRisk: TierLevel;
  directionalLayouts: TierLevel;
  cutListGeneration: TierLevel;

  // Installer Tools
  installerCutSheets: TierLevel;
  remeasureOverlays: TierLevel;
  installerPortal: TierLevel;

  // Analytics & Intelligence
  squareIntelligence: TierLevel; // AI layer
  wasteOptimization: TierLevel;
  installComplexityScoring: TierLevel;
  advancedReporting: TierLevel;
  measurementVerificationLogs: TierLevel;

  // Management & Operations
  jobAuditTrails: TierLevel;
  roleBasedPermissions: TierLevel;
  companyWideTemplates: TierLevel;
  brandedProposals: TierLevel;
  multiLocationManagement: TierLevel;
  regionalReporting: TierLevel;

  // Cross-Device
  crossDeviceSync: TierLevel;
  professionalProposals: TierLevel;
  digitalSignatures: TierLevel;
  measurementConfidenceScoring: TierLevel;

  // Compliance & Enterprise
  complianceAuditExports: TierLevel;
  customWorkflows: TierLevel;
  dedicatedOnboarding: TierLevel;
}

/**
 * Default Feature Matrix
 * 
 * Maps features to minimum tier required
 * Core = everyone gets, Operations = paid upgrade, etc.
 */
export const FEATURE_ACCESS: FeatureAccessMatrix = {
  // Core measurement (included in all paying tiers)
  squareMeasureCore: "essentials",
  squareMeasureAdvanced: "professional",

  // Geometry & canvas (included in Essentials+)
  assistedDraw: "essentials",
  walkTheRoom: "essentials",
  geometryEngine: "essentials",
  snapToGrid: "essentials",

  // Roll-cut & seam (Professional+)
  rollCutOptimizer: "professional",
  seamPlanning: "professional",
  seamVisibilityRisk: "enterprise",
  directionalLayouts: "professional",
  cutListGeneration: "professional",

  // Installer tools (Professional+, Portal on Infrastructure)
  installerCutSheets: "professional",
  remeasureOverlays: "professional",
  installerPortal: "infrastructure",

  // Intelligence (Enterprise included, add-on for others)
  squareIntelligence: "enterprise", // Included in Enterprise
  wasteOptimization: "enterprise",
  installComplexityScoring: "enterprise",
  advancedReporting: "enterprise",
  measurementVerificationLogs: "enterprise",

  // Management (Professional+)
  jobAuditTrails: "professional",
  roleBasedPermissions: "enterprise",
  companyWideTemplates: "enterprise",
  brandedProposals: "enterprise",
  multiLocationManagement: "infrastructure",
  regionalReporting: "infrastructure",

  // Cross-device (all paying tiers)
  crossDeviceSync: "essentials",
  professionalProposals: "essentials",
  digitalSignatures: "essentials",
  measurementConfidenceScoring: "essentials",

  // Infrastructure only
  complianceAuditExports: "infrastructure",
  customWorkflows: "infrastructure",
  dedicatedOnboarding: "infrastructure",
};

/**
 * Optional Add-Ons
 * Features that can be added to lower tiers
 */
export interface AddOnDefinition {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  availableInTiers: TierLevel[];
}

export const ADD_ONS: Record<string, AddOnDefinition> = {
    instantLeadResponsePack: {
      id: "instant-lead-response-pack",
      name: "Instant Lead Response Pack",
      description: "AI-powered instant response to new leads, auto-task creation for human follow-up, and safeguard to prevent duplicate contact. Part of Zero Lead Leak automation.",
      monthlyPrice: 149,
      availableInTiers: ["professional", "enterprise", "infrastructure"],
    },
    followUpCadencePack: {
      id: "follow-up-cadence-pack",
      name: "Follow-Up Cadence Pack",
      description: "Automated follow-up reminders for leads with no response, escalating priority after multiple misses. Part of Zero Lead Leak automation.",
      monthlyPrice: 149,
      availableInTiers: ["professional", "enterprise", "infrastructure"],
    },
    deadLeadRecoveryPack: {
      id: "dead-lead-recovery-pack",
      name: "Dead Lead Recovery Pack",
      description: "AI-driven re-engagement for leads marked lost, with soft outreach after 14–30 days. Part of Zero Lead Leak automation.",
      monthlyPrice: 149,
      availableInTiers: ["professional", "enterprise", "infrastructure"],
    },
  zeroLeadLeakPack: {
    id: "zero-lead-leak-pack",
    name: "Zero Lead Leak Pack",
    description: "Every lead touched. Every time. Replaces sales coordinator/receptionist. Includes instant lead response, follow-up cadence, and dead lead recovery workflows. Moderate AI usage (chat + message drafting).",
    monthlyPrice: 149,
    availableInTiers: ["professional", "enterprise", "infrastructure"],
  },
        complianceAutomationAddon: {
          id: "compliance-automation-addon",
          name: "Compliance Automation",
          description: "Automated compliance workflows, document management, and audit trails. Billed monthly.",
          monthlyPrice: 149, // or 299 for higher tier
          availableInTiers: ["essentials", "professional", "enterprise", "infrastructure"],
        },
        whiteLabelBrandingAddon: {
          id: "white-label-branding-addon",
          name: "White-label Portal",
          description: "Custom branding, client portal, and domain for your business. Billed monthly.",
          monthlyPrice: 99, // or 299 for higher tier
          availableInTiers: ["professional", "enterprise", "infrastructure"],
        },
        multiLocationIntelligenceAddon: {
          id: "multi-location-intelligence-addon",
          name: "Multi-location Intelligence",
          description: "Advanced analytics, reporting, and management for multi-location operations. Billed monthly.",
          monthlyPrice: 299, // or 599 for higher tier
          availableInTiers: ["enterprise", "infrastructure"],
        },
      workflowAutomationAddon: {
        id: "workflow-automation-addon",
        name: "Workflow Automation",
        description: "Unlocks advanced workflow automation and unlimited workflow creation for your workspace. Billed monthly.",
        monthlyPrice: 199,
        availableInTiers: ["essentials", "professional", "enterprise", "infrastructure"],
      },
    apiAccessAddon: {
      id: "api-access-addon",
      name: "API Access",
      description: "Custom integrations, data export, and BI tool access for enterprise clients.",
      monthlyPrice: 499,
      availableInTiers: ["infrastructure"],
    },
  squareIntelligenceAddon: {
    id: "square-intelligence-addon",
    name: "Square Intelligence™ (AI)",
    description: "AI-powered waste optimization and risk analysis",
    monthlyPrice: 99,
    availableInTiers: ["essentials", "professional"],
  },

  extraUserPack5: {
    id: "extra-users-5",
    name: "+5 User Pack",
    description: "Add 5 additional users to your tier",
    monthlyPrice: 199,
    availableInTiers: ["essentials", "professional", "enterprise"],
  },

  dedicatedSupportAddon: {
    id: "dedicated-support",
    name: "Priority Support",
    description: "SLA support with priority feature requests",
    monthlyPrice: 299,
    availableInTiers: ["essentials", "professional", "enterprise"],
  },

  cashAccelerationAddon: {
    id: "cash-acceleration-addon",
    name: "Cash Acceleration",
    description: "Instant invoice, deposit requests, reminders, and partial payment enforcement for faster cash flow.",
    monthlyPrice: 99, // or 199 for higher tier
    availableInTiers: ["essentials", "professional", "enterprise", "infrastructure"],
  },
};

/**
 * Tier Tier Limits & Constraints
 */
export interface TierLimits {
  maxUsers: number;
  maxProposalsPerMonth?: number;
  maxRoomsPerJob?: number;
  apiCallsPerDay?: number;
  storageGBPerMonth?: number;
  supportSLA?: string;
}

export const TIER_LIMITS: Record<TierLevel, TierLimits> = {
  founder: {
    maxUsers: Infinity,
    maxProposalsPerMonth: Infinity,
    maxRoomsPerJob: Infinity,
    apiCallsPerDay: Infinity,
    storageGBPerMonth: Infinity,
    supportSLA: "Unlimited",
  },

  essentials: {
    maxUsers: 5,
    maxProposalsPerMonth: 50,
    maxRoomsPerJob: 100,
    apiCallsPerDay: 10000,
    storageGBPerMonth: 100,
    supportSLA: "Standard (48h response)",
  },

  professional: {
    maxUsers: 15,
    maxProposalsPerMonth: 250,
    maxRoomsPerJob: 500,
    apiCallsPerDay: 50000,
    storageGBPerMonth: 500,
    supportSLA: "Standard (24h response)",
  },

  enterprise: {
    maxUsers: 25,
    maxProposalsPerMonth: Infinity,
    maxRoomsPerJob: Infinity,
    apiCallsPerDay: Infinity,
    storageGBPerMonth: 2000,
    supportSLA: "Priority (12h response)",
  },

  infrastructure: {
    maxUsers: Infinity,
    maxProposalsPerMonth: Infinity,
    maxRoomsPerJob: Infinity,
    apiCallsPerDay: Infinity,
    storageGBPerMonth: Infinity,
    supportSLA: "Dedicated (4h response)",
  },
};

/**
 * Billing Cycle
 */
export type BillingCycle = "monthly" | "annual";

/**
 * User Subscription (Firestore Document)
 */
export interface UserSubscription {
  userId: string;
  workspaceId: string;

  // Current tier
  tier: TierLevel;
  billingCycle: BillingCycle;

  // Pricing
  monthlyAmount: number; // USD (reflects add-ons)
  nextBillingDate: number; // timestamp

  // Team size
  currentUserCount: number;
  seatLimit: number; // From tier

  // Add-ons
  activeAddOns: string[]; // AddOn IDs

  // Billing
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethod?: "card" | "invoice";

  // Status
  status: "active" | "trialing" | "past_due" | "canceled";
  trialEndsAt?: number;
  canceledAt?: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
  autoRenew: boolean;
}

/**
 * Workspace Subscription (admin view)
 */
export interface WorkspaceSubscription {
  workspaceId: string;
  workspaceName: string;
  tier: TierLevel;

  // Company info
  companySize: "micro" | "small" | "medium" | "large" | "enterprise";
  industryType: "flooring" | "other";

  // Subscription details
  subscription: UserSubscription;
  adminUserId: string;

  // Team
  totalUsers: number;
  maxUsers: number;

  // Usage
  proposalsThisMonth: number;
  jobsThisMonth: number;
  roomsMeasured: number;

  // Flags
  isFounder: boolean;
  isTrial: boolean;
  isPastDue: boolean;
}

/**
 * Helper: Check if user has access to feature
 */
export function canAccessFeature(
  tier: TierLevel,
  featureName: keyof FeatureAccessMatrix,
  activeAddOns: string[] = []
): boolean {
  // Founder always has access
  if (tier === "founder") return true;

  // Check main tier access
  const requiredTier = FEATURE_ACCESS[featureName];
  const tierHierarchy: TierLevel[] = ["essentials", "professional", "enterprise", "infrastructure"];

  const userTierIndex = tierHierarchy.indexOf(tier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  if (userTierIndex >= requiredTierIndex) {
    return true;
  }

  // Check add-ons (for features available as add-ons)
  if (featureName === "squareIntelligence") {
    return activeAddOns.includes("square-intelligence-addon");
  }

  return false;
}

/**
 * Helper: Get upgrade path for a feature
 */
export function getUpgradeForFeature(
  currentTier: TierLevel,
  featureName: keyof FeatureAccessMatrix
):
  | {
      type: "tier-upgrade";
      toTier: TierLevel;
      monthlyCost: number;
      savings?: number;
    }
  | {
      type: "addon";
      addonId: string;
      monthlyCost: number;
    }
  | null {
  const requiredTier = FEATURE_ACCESS[featureName];

  // Already has access
  if (canAccessFeature(currentTier, featureName)) {
    return null;
  }

  // Check if available as add-on
  if (featureName === "squareIntelligence" && currentTier !== "infrastructure") {
    return {
      type: "addon",
      addonId: "square-intelligence-addon",
      monthlyCost: 99,
    };
  }

  // Otherwise, need tier upgrade
  const tierHierarchy: TierLevel[] = ["essentials", "professional", "enterprise", "infrastructure"];
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  if (requiredTierIndex > -1) {
    const toTier = tierHierarchy[requiredTierIndex];
    const tierDef = TIER_DEFINITIONS[toTier];

    return {
      type: "tier-upgrade",
      toTier,
      monthlyCost: tierDef.monthlyPrice,
      savings: tierDef.monthlyPrice - TIER_DEFINITIONS[currentTier].monthlyPrice,
    };
  }

  return null;
}

/**
 * Helper: Calculate total monthly cost (tier + add-ons)
 */
export function calculateMonthlyBilling(
  tier: TierLevel,
  activeAddOns: string[] = [],
  extraUserPackCount: number = 0
): number {
  let total = TIER_DEFINITIONS[tier].monthlyPrice;

  // Add add-on costs
  for (const addonId of activeAddOns) {
    const addon = ADD_ONS[addonId];
    if (addon) {
      total += addon.monthlyPrice;
    }
  }

  // Add extra user packs
  total += extraUserPackCount * (ADD_ONS.extraUserPack5?.monthlyPrice || 0);

  return total;
}

/**
 * Export all pricing data for dashboard
 */
export const PRICING_EXPORT = {
  tiers: TIER_DEFINITIONS,
  features: FEATURE_ACCESS,
  addOns: ADD_ONS,
  limits: TIER_LIMITS,
};
