/**
 * Tier Upgrade Component
 *
 * Displays available upgrade options and handles tier transitions
 * Shows current tier, next tier benefits, and pricing
 */

"use client";

import type { TierLevel } from "@/lib/pricingTiers";
import { FEATURE_ACCESS, TIER_DEFINITIONS } from "@/lib/pricingTiers";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TierUpgradeProps {
  currentTier: TierLevel;
  stripeSubscriptionId: string;
  onUpgradeSuccess?: () => void;
}

const TIER_HIERARCHY: TierLevel[] = [
  "essentials",
  "professional",
  "enterprise",
  "infrastructure",
];

export function TierUpgrade({
  currentTier,
  stripeSubscriptionId,
  onUpgradeSuccess,
}: TierUpgradeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get available tiers above current tier
  const currentTierIndex = TIER_HIERARCHY.indexOf(currentTier);
  const availableUpgradeTiers = TIER_HIERARCHY.slice(
    currentTierIndex + 1,
  ) as TierLevel[];

  if (availableUpgradeTiers.length === 0) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">
          You&apos;re on the highest tier (
          {TIER_DEFINITIONS[currentTier].displayName}).
        </p>
      </div>
    );
  }

  const handleUpgrade = async (targetTier: TierLevel) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripeSubscriptionId,
          targetTier,
          prorationBehavior: "create_invoice",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to upgrade subscription");
        return;
      }

      // Success
      onUpgradeSuccess?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {availableUpgradeTiers.map((tier) => {
          const tierDef = TIER_DEFINITIONS[tier];
          const currentTierDef = TIER_DEFINITIONS[currentTier];
          const monthlyIncrease =
            tierDef.monthlyPrice - currentTierDef.monthlyPrice;
          const annualIncrease = monthlyIncrease * 12;

          return (
            <div
              key={tier}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {tierDef.displayName}
              </h3>

              <p className="text-sm text-muted mt-1">{tierDef.description}</p>

              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${tierDef.monthlyPrice}
                  </p>
                  <p className="text-xs text-gray-500">/month</p>
                </div>

                <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                  <span className="font-semibold">+${monthlyIncrease}/mo</span>{" "}
                  <span className="text-xs">
                    (+${annualIncrease}/year from your current plan)
                  </span>
                </div>
              </div>

              {/* Key Feature Highlights */}
              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold text-muted uppercase">
                  Includes:
                </p>
                <ul className="text-sm space-y-1 text-gray-700">
                  {[
                    "teamCapacity",
                    "measurementTools",
                    "analyticsReporting",
                  ].map((feature) => {
                    const featureMinTier = FEATURE_ACCESS[
                      feature as keyof typeof FEATURE_ACCESS
                    ] as TierLevel | undefined;
                    const tierIndex = TIER_HIERARCHY.indexOf(tier);
                    const featureIndex = featureMinTier
                      ? TIER_HIERARCHY.indexOf(featureMinTier)
                      : -1;

                    const isAvailable =
                      featureIndex !== -1 && tierIndex >= featureIndex;

                    return (
                      <li
                        key={feature}
                        className={
                          isAvailable ? "text-green-700" : "text-muted"
                        }
                      >
                        {isAvailable ? "✓" : "✗"}{" "}
                        {feature.replace(/([A-Z])/g, " $1").trim()}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <button
                onClick={() => handleUpgrade(tier)}
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading
                  ? "Processing..."
                  : "Upgrade to " + tierDef.displayName}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        Your subscription will be updated immediately. You&apos;ll receive a
        prorated invoice for the difference.
      </p>
    </div>
  );
}
