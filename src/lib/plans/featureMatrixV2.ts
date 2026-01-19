export type PlanTier = "essentials" | "professional" | "enterprise" | "infrastructure" | "founder";
export type FeatureKey =
  | "measureCore"
  | "laserIntegration"
  | "walkRoom"
  | "geometryEngine"
  | "rollPlanning"
  | "seamOptimization"
  | "cutLists"
  | "aiIntelligence"
  | "installerReports"
  | "templates"
  | "advancedReporting"
  | "rolesPermissions"
  | "multiLocation";

export const FEATURE_MATRIX: Record<PlanTier, Record<FeatureKey, boolean>> = {
  essentials: {
    measureCore: true,
    laserIntegration: true,
    walkRoom: true,
    geometryEngine: true,
    rollPlanning: false,
    seamOptimization: false,
    cutLists: false,
    aiIntelligence: false,
    installerReports: false,
    templates: false,
    advancedReporting: false,
    rolesPermissions: false,
    multiLocation: false,
  },
  professional: {
    measureCore: true,
    laserIntegration: true,
    walkRoom: true,
    geometryEngine: true,
    rollPlanning: true,
    seamOptimization: true,
    cutLists: true,
    aiIntelligence: false,
    installerReports: true,
    templates: false,
    advancedReporting: false,
    rolesPermissions: false,
    multiLocation: false,
  },
  enterprise: {
    measureCore: true,
    laserIntegration: true,
    walkRoom: true,
    geometryEngine: true,
    rollPlanning: true,
    seamOptimization: true,
    cutLists: true,
    aiIntelligence: true,
    installerReports: true,
    templates: true,
    advancedReporting: true,
    rolesPermissions: true,
    multiLocation: false,
  },
  infrastructure: {
    measureCore: true,
    laserIntegration: true,
    walkRoom: true,
    geometryEngine: true,
    rollPlanning: true,
    seamOptimization: true,
    cutLists: true,
    aiIntelligence: true,
    installerReports: true,
    templates: true,
    advancedReporting: true,
    rolesPermissions: true,
    multiLocation: true,
  },
  founder: {
    measureCore: true,
    laserIntegration: true,
    walkRoom: true,
    geometryEngine: true,
    rollPlanning: true,
    seamOptimization: true,
    cutLists: true,
    aiIntelligence: true,
    installerReports: true,
    templates: true,
    advancedReporting: true,
    rolesPermissions: true,
    multiLocation: true,
  },
};
