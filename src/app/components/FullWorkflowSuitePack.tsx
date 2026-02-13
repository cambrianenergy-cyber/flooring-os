import React, { useState } from "react";

export interface FullWorkflowSuitePackProps {
  onTrigger: (agentId: string) => void;
}

export const FullWorkflowSuitePack: React.FC<FullWorkflowSuitePackProps> = ({
  onTrigger,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const agents = [
    { id: "core_workflow", name: "Core Workflow" },
    { id: "sales_accelerator", name: "Sales Accelerator" },
    { id: "estimation_power", name: "Estimation Power" },
    { id: "operations_automation", name: "Operations Automation" },
    {
      id: "business_intelligence",
      name: "Business Intelligence (Suite-Only Bonus)",
    },
  ];

  const handleTrigger = async (agentId: string) => {
    setLoading(agentId);
    setResult(null);
    setError(null);
    try {
      await onTrigger(agentId);
      setResult("Agent executed successfully.");
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unknown error");
      }
    }
    setLoading(null);
  };

  return (
    <div className="border rounded p-4 my-6 bg-gradient-to-br from-accent-warn to-accent-warn-2">
      <h2 className="text-xl font-bold mb-2 text-yellow-800 flex items-center gap-2">
        🧩 Full Workflow Suite{" "}
        <span className="text-sm font-normal ml-2">$399/mo</span>
      </h2>
      <div className="mb-2 text-yellow-900">
        <div className="mb-2">
          Audience: <b>Serious operators, Pro & Elite users</b>
        </div>
        <div className="mb-2">
          Includes:
          <ul className="list-disc pl-6">
            <li>Core Workflow</li>
            <li>Sales Accelerator</li>
            <li>Estimation Power</li>
            <li>Operations Automation</li>
            <li>
              <b>Bonus:</b> Business Intelligence Agent (Suite-Only)
            </li>
          </ul>
        </div>
        <div className="mb-2 p-2 bg-yellow-200 rounded">
          <b>Why this converts:</b> Feels like hiring a sales manager,
          estimator, and ops manager for less than one day of payroll.
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {agents.map((agent) => (
          <button
            key={agent.id}
            className="px-3 py-2 rounded bg-yellow-600 text-background hover:bg-yellow-700 disabled:opacity-50"
            onClick={() => handleTrigger(agent.id)}
            disabled={!!loading}
          >
            {loading === agent.id ? "Running..." : `Run ${agent.name}`}
          </button>
        ))}
      </div>
      {result && (
        <div className="my-2 p-2 bg-green-100 text-green-800 rounded">
          {result}
        </div>
      )}
      {error && (
        <div className="my-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>
      )}
    </div>
  );
};
