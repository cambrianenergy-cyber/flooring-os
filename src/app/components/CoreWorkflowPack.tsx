import React from "react";

const CORE_AGENTS = [
  {
    id: "estimator",
    label: "Job Intake Agent",
    description: "Converts leads into structured jobs, extracts room counts, materials, sqft, and flags missing info.",
    triggerLabel: "Convert Lead to Job"
  },
  {
    id: "scheduling",
    label: "Scheduling Agent",
    description: "Suggests install timelines, accounts for crew availability, prevents overbooking.",
    triggerLabel: "Suggest Install Timeline"
  },
  {
    id: "materials",
    label: "Material Prep Agent",
    description: "Generates material lists, calculates waste buffers, prepares order-ready breakdowns.",
    triggerLabel: "Generate Material List"
  },
  {
    id: "jobSummary",
    label: "Job Organizer Agent",
    description: "Keeps jobs clean, tagged, searchable, detects stalled/inactive jobs, alerts owners to bottlenecks.",
    triggerLabel: "Organize Job"
  }
];

export function CoreWorkflowPack({ onTrigger }: { onTrigger: (agentId: string) => void }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2">🔹 Core Workflow Pack <span className="text-xs text-blue-600">(Included in All Plans)</span></h2>
      <div className="mb-3 text-gray-700 text-sm">
        <strong>Why this matters:</strong> This makes Square Flooring usable on Day 1 — but not “advanced.”
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CORE_AGENTS.map(agent => (
          <div key={agent.id} className="border rounded-lg p-4 bg-blue-50 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-lg mb-1">{agent.label}</div>
              <div className="text-gray-700 mb-2 text-sm">{agent.description}</div>
            </div>
            <button
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
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
