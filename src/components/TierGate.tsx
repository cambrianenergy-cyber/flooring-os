/**
 * Tier Gate Components
 *
 * Display locked features with "Upgrade to unlock" prompts
 * NOT just hidden (that builds resentment)
 *
 * Design: Clear explanation of business value + path to upgrade
 */

"use client";

import type { FeatureAccessMatrix, TierLevel } from "@/lib/pricingTiers";
import { TIER_DEFINITIONS } from "@/lib/pricingTiers";
import {
    useCanAccessFeature,
    useFeatureUpgrade,
    useTier,
    useTierComparison,
} from "@/lib/useTier";
import React from "react";

/**
 * <TierGate>
 * Conditional rendering based on tier access
 *
 * Shows "Upgrade" button if locked, renders children if allowed
 *
 * Usage:
 *   <TierGate feature="rollCutOptimizer">
 *     <RollCutOptimizer />
 *   </TierGate>
 *
 *   <TierGate
 *     feature="rollCutOptimizer"
 *     fallback={<LockedMessage />}
 *   >
 *     <RollCutOptimizer />
 *   </TierGate>
 */
export interface TierGateProps {
  feature: keyof FeatureAccessMatrix;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgradeClick?: () => void;
  showReason?: boolean; // Show why this is locked
}

export function TierGate({
  feature,
  children,
  fallback,
  onUpgradeClick,
  showReason = true,
}: TierGateProps) {
  const hasAccess = useCanAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <TierGateDefault
      feature={feature}
      onUpgradeClick={onUpgradeClick}
      showReason={showReason}
    />
  );
}

/**
 * Default "upgrade" UI when feature is locked
 * Shows clear value prop + upgrade path
 */
function TierGateDefault({
  feature,
  onUpgradeClick,
  showReason,
}: {
  feature: keyof FeatureAccessMatrix;
  onUpgradeClick?: () => void;
  showReason: boolean;
}) {
  const upgrade = useFeatureUpgrade(feature);
  const { tier } = useTier();

  if (!upgrade) {
    return null;
  }

  const featureName = formatFeatureName(feature);
  const isAddon = upgrade.type === "addon";
  const isTierUpgrade = upgrade.type === "tier-upgrade";

  return (
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900">🔒 {featureName}</h3>

          {showReason && (
            <p className="mt-2 text-sm text-blue-800">
              {getFeatureDescription(feature)}
            </p>
          )}

          {isTierUpgrade && (
            <div className="mt-4 rounded bg-background text-slate-900 p-3">
              <p className="text-sm font-semibold text-blue-900">
                Upgrade to {TIER_DEFINITIONS[upgrade.toTier].displayName}
              </p>
              <p className="mt-1 text-sm text-muted">
                $
                {upgrade.toTier === "enterprise"
                  ? "2,500+"
                  : upgrade.monthlyCost}
                /month
              </p>
              {upgrade.savings && upgrade.savings > 0 && (
                <p className="mt-1 text-xs text-green-600">
                  Includes all features from{" "}
                  {TIER_DEFINITIONS[tier].displayName}, plus more
                </p>
              )}
            </div>
          )}

          {isAddon && (
            <div className="mt-4 rounded bg-background text-slate-900 p-3">
              <p className="text-sm font-semibold text-blue-900">
                Add {getAddonName(upgrade.addonId)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Only ${upgrade.monthlyCost}/month
              </p>
              <p className="mt-1 text-xs text-green-600">
                No tier change needed — just add to your plan
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onUpgradeClick || (() => navigateToUpgrade(upgrade.type))}
          className="whitespace-nowrap rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Unlock →
        </button>
      </div>
    </div>
  );
}

/**
 * <TierUpgradePrompt>
 * Larger modal/card for tier upgrade decision
 * Shows comparison between current and target tier
 */
export interface TierUpgradePromptProps {
  feature: keyof FeatureAccessMatrix;
  onCancel?: () => void;
  onUpgrade?: (tier: TierLevel) => void;
}

export function TierUpgradePrompt({
  feature,
  onCancel,
  onUpgrade,
}: TierUpgradePromptProps) {
  const upgrade = useFeatureUpgrade(feature);
  const { tier } = useTier();
  // Always call hooks in the same order
  const targetTier =
    upgrade && upgrade.type === "tier-upgrade" ? upgrade.toTier : "essentials";
  const comparison = useTierComparison(targetTier);
  if (!upgrade || upgrade.type !== "tier-upgrade") {
    return null;
  }
  const targetDef = TIER_DEFINITIONS[targetTier];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-overlay/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white text-slate-900 p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900">
          Unlock {formatFeatureName(feature)}
        </h2>

        <p className="mt-2 text-muted">{getFeatureDescription(feature)}</p>

        <div className="mt-6 grid grid-cols-2 gap-6">
          {/* Current tier */}
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900">Current Plan</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {TIER_DEFINITIONS[tier].displayName}
            </p>
            <p className="text-sm text-muted">
              ${TIER_DEFINITIONS[tier].monthlyPrice}/month
            </p>
          </div>

          {/* Target tier */}
          <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
            <p className="font-semibold text-green-900">Unlock</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {targetDef.displayName}
            </p>
            <p className="text-sm text-muted">
              ${targetDef.monthlyPrice}/month (+ $
              {upgrade.monthlyCost - TIER_DEFINITIONS[tier].monthlyPrice}/month)
            </p>
          </div>
        </div>

        {/* New features in target tier */}
        {comparison.newFeatures.length > 0 && (
          <div className="mt-6">
            <p className="font-semibold text-gray-900">
              Plus, you&apos;ll get:
            </p>
            <ul className="mt-3 space-y-2">
              {comparison.newFeatures.slice(0, 5).map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="text-green-600">✓</span>
                  {formatFeatureName(feature)}
                </li>
              ))}
              {comparison.newFeatures.length > 5 && (
                <li className="text-sm text-gray-500">
                  + {comparison.newFeatures.length - 5} more features
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpgrade?.(targetTier)}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
          >
            Upgrade to {targetDef.displayName}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Upgrade takes effect immediately. Billing adjusts prorated.
        </p>
      </div>
    </div>
  );
}

/**
 * <TierLockedButton>
 * Replacement for buttons that are locked to higher tiers
 *
 * Usage:
 *   {canAccess('rollCutOptimizer') ? (
 *     <button onClick={handleOptimize}>Optimize</button>
 *   ) : (
 *     <TierLockedButton feature="rollCutOptimizer" />
 *   )}
 */
export function TierLockedButton({
  feature,
  className = "",
}: {
  feature: keyof FeatureAccessMatrix;
  className?: string;
}) {
  const upgrade = useFeatureUpgrade(feature);

  if (!upgrade) return null;

  const label =
    upgrade.type === "tier-upgrade"
      ? `Upgrade (${upgrade.type === "tier-upgrade" ? "$" + upgrade.monthlyCost : ""})`
      : `Add-on ($${upgrade.monthlyCost}/mo)`;

  return (
    <button
      disabled
      title={`Unlock: ${formatFeatureName(feature)}`}
      className={`rounded bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed ${className}`}
    >
      🔒 {label}
    </button>
  );
}

/**
 * <TierBadge>
 * Visual indicator of required tier for a feature
 *
 * Usage:
 *   <h3>
 *     Roll-Cut Optimizer
 *     <TierBadge feature="rollCutOptimizer" />
 *   </h3>
 */
export function TierBadge({ feature }: { feature: keyof FeatureAccessMatrix }) {
  const upgrade = useFeatureUpgrade(feature);

  if (!upgrade) return null; // User has access

  if (upgrade.type === "tier-upgrade") {
    return (
      <span className="ml-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
        {TIER_DEFINITIONS[upgrade.toTier].displayName}+
      </span>
    );
  }

  if (upgrade.type === "addon") {
    return (
      <span className="ml-2 inline-block rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
        Add-On
      </span>
    );
  }

  return null;
}

// ============================================================================
// Helpers
// ============================================================================

function formatFeatureName(feature: string): string {
  return feature
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function getFeatureDescription(feature: keyof FeatureAccessMatrix): string {
  const descriptions: Record<keyof FeatureAccessMatrix, string> = {
    squareMeasureCore: "Core measurement tools",
    squareMeasureAdvanced: "Advanced measurement features",
    assistedDraw: "Assisted geometry drawing",
    walkTheRoom: "Walk-the-room measurement",
    geometryEngine: "Geometry calculations",
    snapToGrid: "Snap-to-grid alignment",
    rollCutOptimizer:
      "Automatically optimize roll-cut seams for waste reduction",
    seamPlanning: "Plan seams for optimal appearance and waste",
    seamVisibilityRisk: "AI analysis of seam visibility risks",
    directionalLayouts: "Design directional patterns",
    cutListGeneration: "Generate installer-ready cut lists",
    installerCutSheets: "Create professional cut sheets",
    remeasureOverlays: "Overlay historical measurements",
    installerPortal: "Installer mobile portal",
    squareIntelligence: "AI-powered insights",
    wasteOptimization: "Intelligent waste optimization",
    installComplexityScoring: "Complexity analysis for pricing",
    advancedReporting: "Advanced analytics and reporting",
    measurementVerificationLogs: "Audit trail for measurements",
    jobAuditTrails: "Complete job audit logs",
    roleBasedPermissions: "Advanced role controls",
    companyWideTemplates: "Company-wide design templates",
    brandedProposals: "Custom branded proposals",
    multiLocationManagement: "Manage multiple locations",
    regionalReporting: "Regional performance reports",
    crossDeviceSync: "Cross-device synchronization",
    professionalProposals: "Professional proposal generation",
    digitalSignatures: "Digital signature capture",
    measurementConfidenceScoring: "Measurement confidence scoring",
    complianceAuditExports: "Compliance audit exports",
    customWorkflows: "Custom workflow configuration",
    dedicatedOnboarding: "Dedicated onboarding support",
  };

  return descriptions[feature] || "This feature";
}

function getAddonName(addonId: string): string {
  const names: Record<string, string> = {
    "square-intelligence-addon": "Square Intelligence™ (AI)",
    "extra-users-5": "+5 User Pack",
    "dedicated-support": "Priority Support",
  };
  return names[addonId] || "Add-On";
}

function navigateToUpgrade(type: "tier-upgrade" | "addon") {
  // Navigate to billing page
  window.location.href = "/settings/billing?action=" + type;
}
