"use client";

import { TierGate, TierUpgradePrompt } from "@/components/TierGate";
import type { FeatureAccessMatrix } from "@/lib/pricingTiers";
import { useCanAccessFeature } from "@/lib/useTier";
import React, { useState } from "react";

interface FeatureLockedActionProps {
  feature: keyof FeatureAccessMatrix;
  featureName: string;
  featureDescription: string;
  children: React.ReactNode;
  onAction?: () => void;
}

export function FeatureLockedAction({
  feature,
  featureName,
  featureDescription,
  children,
  onAction,
}: FeatureLockedActionProps) {
  const canAccess = useCanAccessFeature(feature);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="space-y-4">
      <TierGate feature={feature}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900">{featureName}</h3>
          <p className="text-sm text-blue-800 mt-1">{featureDescription}</p>
          <div className="mt-4">{children}</div>
          {onAction && (
            <button
              onClick={onAction}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Do Action
            </button>
          )}
        </div>
      </TierGate>
      {!canAccess && (
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Upgrade to Unlock
        </button>
      )}
      {showUpgradeModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-overlay bg-opacity-50 z-50">
          <div className="bg-background text-slate-900 rounded-lg p-8 max-w-md w-full">
            <h4 className="font-bold text-lg mb-2">Upgrade Required</h4>
            <p className="mb-4">This feature requires a higher plan.</p>
            <TierUpgradePrompt feature={feature} />
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeatureLockedAction;
