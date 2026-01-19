import React from "react";

const SALES_AGENTS = [
  {
    id: "leadQualification",
    label: "Lead Qualification Agent",
    description: "Scores incoming leads, flags high-intent prospects, recommends follow-up priority.",
    triggerLabel: "Qualify Lead"
  },
  {
    id: "proposalWriting",
    label: "Proposal Writing Agent",
    description: "Writes professional proposals, adjusts tone, rewrites objections automatically.",
    triggerLabel: "Write Proposal"
  },
  {
    id: "followUp",
    label: "Follow-Up Agent",
    description: "Generates follow-up scripts, schedules reminders, detects ghosting risk.",
    triggerLabel: "Generate Follow-Up"
  },
  {
    id: "closeRateAnalyst",
    label: "Close Rate Analyst",
    description: "Tracks win/loss reasons, compares pricing vs close rate, identifies sales leaks.",
    triggerLabel: "Analyze Close Rate"
  }
];

export function SalesAcceleratorPack({ onTrigger }: { onTrigger: (agentId: string) => void }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2">🔹 Sales Accelerator Pack <span className="text-xs text-pink-600">($149/mo, Owners & Sales-Driven Contractors)</span></h2>
      <div className="mb-3 text-gray-700 text-sm">
        <strong>Why this sells:</strong> Owners feel this pack in revenue within weeks.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SALES_AGENTS.map(agent => (
          <div key={agent.id} className="border rounded-lg p-4 bg-pink-50 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-lg mb-1">{agent.label}</div>
              <div className="text-gray-700 mb-2 text-sm">{agent.description}</div>
            </div>
            <button
              className="mt-2 bg-pink-600 text-white px-4 py-2 rounded font-semibold hover:bg-pink-700 transition"
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
