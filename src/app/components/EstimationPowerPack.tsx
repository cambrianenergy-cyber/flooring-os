import React from "react";

const ESTIMATION_AGENTS = [
  {
    id: "smartEstimator",
    label: "Smart Estimator Agent",
    description: "Generates estimates from job data, adjusts for complexity & layout, normalizes pricing across crews.",
    triggerLabel: "Generate Estimate"
  },
  {
    id: "pricingOptimizer",
    label: "Pricing Optimizer Agent",
    description: "Suggests price ranges, compares historical jobs, warns underpricing risk.",
    triggerLabel: "Optimize Pricing"
  },
  {
    id: "marginGuard",
    label: "Margin Guard Agent",
    description: "Flags thin-margin jobs, detects labor/material imbalance, recommends corrections before sending.",
    triggerLabel: "Guard Margin"
  },
  {
    id: "estimateComparator",
    label: "Estimate Comparator Agent",
    description: "Compares estimates side-by-side, shows price vs close probability, learns from past wins/losses.",
    triggerLabel: "Compare Estimates"
  }
];

export function EstimationPowerPack({ onTrigger }: { onTrigger: (agentId: string) => void }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2">🔹 Estimation Power Pack <span className="text-xs text-purple-600">($199/mo, Precision-Focused Contractors)</span></h2>
      <div className="mb-3 text-gray-700 text-sm">
        <strong>Why this is dangerous:</strong> This is where Square stops being “software” and becomes decision intelligence.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ESTIMATION_AGENTS.map(agent => (
          <div key={agent.id} className="border rounded-lg p-4 bg-purple-50 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-lg mb-1">{agent.label}</div>
              <div className="text-gray-700 mb-2 text-sm">{agent.description}</div>
            </div>
            <button
              className="mt-2 bg-purple-600 text-white px-4 py-2 rounded font-semibold hover:bg-purple-700 transition"
              onClick={() => onTrigger(agent.id)}
            >
              {agent.triggerLabel}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
