/**
 * Billing Settings Component
 * Example: Shows current tier, billing info, and upgrade options
 */

"use client";

import React from "react";
import {
  useTier,
  useBillingInfo,
  useTeamCapacity,
  useTierDefinition,
  useAddOns,
} from "@/lib/useTier";
import { TierBadge, TierUpgradePrompt } from "@/components/TierGate";
import { TIER_DEFINITIONS } from "@/lib/pricingTiers";
import type { TierLevel } from "@/lib/pricingTiers";

interface BillingSettingsProps {
  onUpgradeClick?: (tier: TierLevel) => void;
}

/**
 * Shows current billing tier, team capacity, and add-ons
 */
export function BillingSettings({ onUpgradeClick }: BillingSettingsProps) {
  const { tier, isFounder } = useTier();
  const billing = useBillingInfo();
  const capacity = useTeamCapacity();
  const tierDef = useTierDefinition();
  const { activeAddOns } = useAddOns();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [upgradeTarget, setUpgradeTarget] = React.useState<TierLevel | null>(
    null
  );

  if (!billing) {
    return <div>Loading billing information...</div>;
  }

  const handleUpgradeClick = (targetTier: TierLevel) => {
    setUpgradeTarget(targetTier);
    setShowUpgradeModal(true);
    onUpgradeClick?.(targetTier);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Current Tier Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {tierDef?.displayName || "Square " + tier.charAt(0).toUpperCase() + tier.slice(1)}
            </h2>
            <p className="text-gray-600 mt-1">{tierDef?.description}</p>
          </div>
          <TierBadge feature="rollCutOptimizer" />
        </div>

        {/* Billing Details Grid */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Monthly Cost</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${billing.monthlyPrice}
              <span className="text-xs text-gray-600 font-normal">/mo</span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Billing Cycle</p>
            <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
              {billing.billingCycle}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Next Billing</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {billing.nextBillingDate ? new Date(billing.nextBillingDate).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              billing.status === "active"
                ? "bg-green-100 text-green-800"
                : billing.status === "trialing"
                  ? "bg-blue-100 text-blue-800"
                  : billing.status === "past_due"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {billing.status === "active"
              ? "✓ Active"
              : billing.status === "trialing"
                ? "🎯 Trial"
                : billing.status === "past_due"
                  ? "⚠️ Past Due"
                  : "Canceled"}
          </div>
          {isFounder && (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              👑 Founder (Unlimited)
            </div>
          )}
        </div>
      </div>

      {/* Team Capacity Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900">Team Size</h3>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700">
              Members: {capacity.current} / {capacity.max}
            </p>
            <p className="text-sm text-gray-600">
              {capacity.percentageUsed.toFixed(0)}%
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                capacity.percentageUsed > 80
                  ? "bg-red-600"
                  : "bg-blue-600"
              }`}
              style={{ width: `${Math.min(capacity.percentageUsed, 100)}%` }}
            />
          </div>

          <p className="text-xs text-gray-600 mt-2">
            {capacity.slotsRemaining} seats available
          </p>
        </div>

        {!capacity.hasCapacity && (
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Add More Users
          </button>
        )}
      </div>

      {/* Active Add-ons Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900">Add-ons</h3>

        {activeAddOns.length > 0 ? (
          <div className="mt-4 space-y-2">
            {activeAddOns.map((addOn) => (
              <div
                key={addOn}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div>
                  <p className="font-medium text-blue-900">
                    {addOn === "square-intelligence-addon"
                      ? "Square Intelligence™"
                      : addOn === "extra-user-pack-1"
                        ? "Extra User Pack (5 users)"
                        : addOn === "priority-support"
                          ? "Priority Support"
                          : addOn}
                  </p>
                  <p className="text-xs text-blue-700">Active</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-gray-600 text-sm">
            No add-ons currently active
          </p>
        )}

        <button className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium">
          Browse Add-ons
        </button>
      </div>

      {/* Upgrade Options Section (if not on Enterprise) */}
      {tier !== "enterprise" && !isFounder && (
        <div className="bg-white rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-bold text-gray-900">Upgrade Your Plan</h3>
          <p className="text-gray-600 mt-1 text-sm">
            Unlock more features and increase your team capacity
          </p>

          <div className="mt-4 space-y-2">
            {(["professional", "enterprise", "infrastructure"] as TierLevel[]).map(
              (targetTier) => {
                if (
                  ["essentials", "professional", "enterprise"].indexOf(tier) >=
                  ["essentials", "professional", "enterprise"].indexOf(targetTier)
                ) {
                  return null; // Skip if user already on this tier or higher
                }

                const targetDef = TIER_DEFINITIONS[targetTier];
                const cost = targetDef.monthlyPrice - billing.monthlyPrice;

                return (
                  <button
                    key={targetTier}
                    onClick={() => handleUpgradeClick(targetTier)}
                    className="w-full px-4 py-3 text-left bg-white rounded-lg border border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {targetDef.displayName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {targetDef.maxUsers === Infinity
                            ? "Unlimited users"
                            : `Up to ${targetDef.maxUsers} users`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          +${cost}/mo
                        </p>
                        <p className="text-xs text-gray-600">
                          ${targetDef.monthlyPrice}/mo
                        </p>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && upgradeTarget && (
        <TierUpgradePrompt feature="rollCutOptimizer" />
      )}
    </div>
  );
}

export default BillingSettings;
