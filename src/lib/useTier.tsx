/**
 * Tier Access Hooks & Context
 * 
 * React hooks for checking tier access and managing billing
 * Designed for use in any component with current user's subscription
 */

"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  TierLevel,
  FeatureAccessMatrix,
  UserSubscription,
  canAccessFeature,
  getUpgradeForFeature,
  calculateMonthlyBilling,
  TIER_DEFINITIONS,
  TIER_LIMITS,
  FEATURE_ACCESS,
  ADD_ONS,
} from "@/lib/pricingTiers";

/**
 * Tier Context Type
 */
export interface TierContextType {
  // Current subscription
  subscription: UserSubscription | null;
  tier: TierLevel;
  isFounder: boolean;

  // Access control
  canAccess: (feature: keyof FeatureAccessMatrix) => boolean;
  getUpgrade: (feature: keyof FeatureAccessMatrix) => ReturnType<typeof getUpgradeForFeature>;

  // Limits
  currentUserCount: number;
  maxUserCount: number;
  hasUserCapacity: boolean;

  // Add-ons
  activeAddOns: string[];
  hasAddOn: (addonId: string) => boolean;

  // Billing
  monthlyBilling: number;
  billingCycle: "monthly" | "annual";
}

const TierContext = createContext<TierContextType | null>(null);

/**
 * Tier Provider
 * Wrap your app with this to provide subscription context
 * 
 * Usage:
 *   <TierProvider subscription={userSubscription}>
 *     <App />
 *   </TierProvider>
 */
export function TierProvider({
  children,
  subscription,
}: {
  children: React.ReactNode;
  subscription: UserSubscription | null;
}) {
  const value = useMemo<TierContextType>(() => {
    const tier = subscription?.tier || "essentials";
    const isFounder = tier === "founder";

    return {
      subscription,
      tier,
      isFounder,

      canAccess: (feature) => {
        const activeAddOns = subscription?.activeAddOns || [];
        // Smart Rule: Allow access until end of paid period even if canceled or past_due
        const status = subscription?.status;
        const now = Date.now();
        const nextBillingDate = subscription?.nextBillingDate;
        // If canceled or past_due, but still within paid period, allow access
        if ((status === "canceled" || status === "past_due") && nextBillingDate && now < nextBillingDate) {
          return canAccessFeature(tier, feature, activeAddOns);
        }
        // Otherwise, only allow if not canceled/past_due or founder
        if (status === "active" || status === "trialing" || isFounder) {
          return canAccessFeature(tier, feature, activeAddOns);
        }
        // Block access otherwise
        return false;
      },

      getUpgrade: (feature) => {
        if (tier === "founder") return null;
        return getUpgradeForFeature(tier, feature);
      },

      currentUserCount: subscription?.currentUserCount || 1,
      maxUserCount: subscription?.seatLimit || TIER_LIMITS[tier].maxUsers,
      hasUserCapacity:
        (subscription?.currentUserCount || 0) < (subscription?.seatLimit || TIER_LIMITS[tier].maxUsers),

      activeAddOns: subscription?.activeAddOns || [],
      hasAddOn: (addonId) => (subscription?.activeAddOns || []).includes(addonId),

      monthlyBilling: subscription
        ? calculateMonthlyBilling(
            subscription.tier,
            subscription.activeAddOns,
            (() => {
              // Calculate extra user packs needed
              const baseLimit = subscription.seatLimit || TIER_LIMITS[tier].maxUsers;
              const count = subscription.currentUserCount || 1;
              if (count <= baseLimit) return 0;
              // Each pack adds 5 users
              return Math.ceil((count - baseLimit) / 5);
            })()
          )
        : 0,

      billingCycle: subscription?.billingCycle || "monthly",
    };
  }, [subscription]);

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

/**
 * Hook: useTier
 * Get current tier information
 * 
 * Usage:
 *   const { tier, isFounder, canAccess } = useTier();
 */
export function useTier(): TierContextType {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error("useTier must be used within TierProvider");
  }
  return context;
}

/**
 * Hook: useCanAccessFeature
 * Check if current tier has access to a feature
 * 
 * Usage:
 *   const canEdit = useCanAccessFeature("rollCutOptimizer");
 *   if (!canEdit) return <UpgradePrompt />;
 */
export function useCanAccessFeature(feature: keyof FeatureAccessMatrix): boolean {
  const { canAccess } = useTier();
  return canAccess(feature);
}

/**
 * Hook: useFeatureUpgrade
 * Get upgrade information for a locked feature
 * 
 * Usage:
 *   const upgrade = useFeatureUpgrade("rollCutOptimizer");
 *   if (upgrade?.type === "tier-upgrade") {
 *     return <UpgradeToTier tier={upgrade.toTier} />;
 *   }
 *   if (upgrade?.type === "addon") {
 *     return <AddOnPromotion addon={upgrade.addonId} />;
 *   }
 */
export function useFeatureUpgrade(feature: keyof FeatureAccessMatrix) {
  const { getUpgrade } = useTier();
  return getUpgrade(feature);
}

/**
 * Hook: useTierLimits
 * Get current tier's limits (max users, proposals, etc.)
 */
export function useTierLimits() {
  const { tier } = useTier();
  return TIER_LIMITS[tier];
}

/**
 * Hook: useTierDefinition
 * Get tier metadata (name, price, description, etc.)
 */
export function useTierDefinition(): typeof TIER_DEFINITIONS[TierLevel] {
  const { tier } = useTier();
  return TIER_DEFINITIONS[tier];
}

/**
 * Hook: useBillingInfo
 * Get billing details
 */
export function useBillingInfo() {
  const { subscription, monthlyBilling, billingCycle } = useTier();

  return {
    tier: subscription?.tier || "essentials",
    monthlyPrice: monthlyBilling,
    billingCycle,
    nextBillingDate: subscription?.nextBillingDate,
    stripeCustomerId: subscription?.stripeCustomerId,
    status: subscription?.status || "active",
    autoRenew: subscription?.autoRenew || true,
  };
}

/**
 * Hook: useTeamCapacity
 * Check user seat capacity
 * 
 * Usage:
 *   const { hasCapacity, current, max } = useTeamCapacity();
 *   if (!hasCapacity) return <BuyMoreSeatsButton />;
 */
export function useTeamCapacity() {
  const { currentUserCount, maxUserCount, hasUserCapacity } = useTier();

  return {
    current: currentUserCount,
    max: maxUserCount,
    hasCapacity: hasUserCapacity,
    percentageUsed: (currentUserCount / maxUserCount) * 100,
    slotsRemaining: maxUserCount - currentUserCount,
  };
}

/**
 * Hook: useAddOns
 * Get active add-ons and check if available
 */
export function useAddOns() {
  const { tier, activeAddOns, hasAddOn } = useTier();

  return {
    activeAddOns,
    hasAddOn,
    availableAddOns: Object.values(ADD_ONS).filter((addon) =>
      addon.availableInTiers.includes(tier)
    ),
  };
}

/**
 * Hook: useTierComparison
 * Get comparison between current tier and another tier
 * Useful for upgrade prompts
 */
export function useTierComparison(targetTier: TierLevel) {
  const { tier } = useTier();

  const currentDef = TIER_DEFINITIONS[tier];
  const targetDef = TIER_DEFINITIONS[targetTier];

  return {
    currentTier: tier,
    targetTier,
    currentPrice: currentDef.monthlyPrice,
    targetPrice: targetDef.monthlyPrice,
    priceDifference: targetDef.monthlyPrice - currentDef.monthlyPrice,
    targetFeatures: Object.entries(FEATURE_ACCESS)
      .filter(([, minTier]) => minTier === targetTier)
      .map(([feature]) => feature),
    newFeatures: Object.entries(FEATURE_ACCESS)
      .filter(([, minTier]) => {
        const targetIndex = ["essentials", "professional", "enterprise", "infrastructure"].indexOf(targetTier);
        const currentIndex = ["essentials", "professional", "enterprise", "infrastructure"].indexOf(tier);
        return (
          ["essentials", "professional", "enterprise", "infrastructure"].indexOf(minTier) > currentIndex &&
          ["essentials", "professional", "enterprise", "infrastructure"].indexOf(minTier) <= targetIndex
        );
      })
      .map(([feature]) => feature),
  };
}

/**
 * Hook: useIsFounder
 * Simple check for founder tier
 */
export function useIsFounder(): boolean {
  const { isFounder } = useTier();
  return isFounder;
}
