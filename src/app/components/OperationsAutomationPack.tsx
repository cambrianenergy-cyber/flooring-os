import React from "react";

const OPS_AGENTS = [
  {
    id: "workflowAutomation",
    label: "Workflow Automation Agent",
    description: "Executes job transitions automatically, moves jobs based on status changes, eliminates manual admin work.",
    triggerLabel: "Automate Workflow"
  },
  {
    id: "compliance",
    label: "Compliance Agent",
    description: "Checks permits & requirements, flags missing documentation, prevents last-minute delays.",
    triggerLabel: "Check Compliance"
  },
  {
    id: "crewCoordination",
    label: "Crew Coordination Agent",
    description: "Assigns crews intelligently, balances workload, detects crew inefficiencies.",
    triggerLabel: "Coordinate Crews"
  },
  {
    id: "delayDetection",
    label: "Delay Detection Agent",
    description: "Detects schedule slippage, alerts owners early, recommends fixes.",
    triggerLabel: "Detect Delays"
  }
];

export function OperationsAutomationPack({ onTrigger }: { onTrigger: (agentId: string) => void }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2">🔹 Operations Automation Pack <span className="text-xs text-orange-600">($249/mo, Multi-Crew/Scaling Ops)</span></h2>
      <div className="mb-3 text-gray-700 text-sm">
        <strong>Why this upgrades users:</strong> Once ops get smoother, downgrading feels impossible.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPS_AGENTS.map(agent => (
          <div key={agent.id} className="border rounded-lg p-4 bg-orange-50 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-lg mb-1">{agent.label}</div>
              <div className="text-gray-700 mb-2 text-sm">{agent.description}</div>
            </div>
            <button
              className="mt-2 bg-orange-600 text-white px-4 py-2 rounded font-semibold hover:bg-orange-700 transition"
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
