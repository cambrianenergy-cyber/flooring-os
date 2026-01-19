"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Modal from "../ai-agents/Modal";
import { AGENT_REGISTRY } from "../ai-agents/agentRegistry";

type AgentId = "estimator" | "inbox" | "leadScoring" | "workflow";
type AgentField = { name: string; label: string; type: string };
type Agent = { id: AgentId; label: string; description: string };

const agentFields: Record<AgentId, AgentField[]> = {
  estimator: [
    { name: "sqft", label: "Square Feet", type: "number" },
    { name: "product", label: "Product Name", type: "text" },
    { name: "accessories", label: "Accessories (comma separated)", type: "text" },
  ],
  inbox: [
    { name: "message", label: "Message", type: "text" },
    { name: "action", label: "Action (route/view)", type: "text" },
  ],
  leadScoring: [
    { name: "userRole", label: "User Role", type: "text" },
    { name: "leads", label: "Leads (JSON array)", type: "text" },
  ],
  workflow: [
    { name: "workflowType", label: "Workflow Type (approval/onboarding/jobProgress)", type: "text" },
    { name: "data", label: "Workflow Data (JSON object)", type: "text" },
  ],
};

const dashboardAgents: AgentId[] = ["estimator", "inbox", "leadScoring", "workflow"];

export default function DashboardAgents() {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const filteredAgents: Agent[] = AGENT_REGISTRY.filter(
    (agent: unknown): agent is Agent => {
      return typeof agent === "object" && agent !== null && dashboardAgents.includes((agent as Agent).id as AgentId);
    }
  );

  const handleOpenModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({});
    setResult(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAgent(null);
    setFormData({});
    setResult(null);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAgent || !selectedAgent.id) {
      setResult({ error: "No agent selected. Please choose an agent before submitting." });
      setLoading(false);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = { ...formData, agentType: selectedAgent.id };
      if (selectedAgent.id === "estimator") {
        // Parse product as JSON object if possible
        try {
          payload.product = JSON.parse(formData.product);
        } catch {
          payload.product = { name: formData.product };
        }
        // Parse accessories as array
        payload.accessories = formData.accessories
          ? formData.accessories.split(",").map((a) => a.trim()).filter(Boolean)
          : [];
        // Convert sqft to number
        payload.sqft = Number(formData.sqft) || 0;
      }
      const res = await fetch(`/api/ai/agents/${selectedAgent.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Failed to contact agent." });
    }
    setLoading(false);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">AI Dashboard Agents</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="border rounded-lg p-4 shadow-sm flex flex-col justify-between bg-blue-50">
            <div>
              <div className="font-semibold text-lg mb-1">{agent.label}</div>
              <div className="text-gray-700 mb-3 text-sm">{agent.description}</div>
            </div>
            <button
              className="mt-auto bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
              onClick={() => handleOpenModal(agent)}
            >
              Interact
            </button>
          </div>
        ))}
      </div>
      <Modal open={modalOpen} onClose={handleCloseModal} title={selectedAgent?.label || ""}>
        {selectedAgent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {(agentFields[selectedAgent.id as AgentId] || []).map((field: AgentField) => (
              <div key={field.name}>
                <label className="block font-medium mb-1">{field.label}</label>
                <input
                  name={field.name}
                  type={field.type}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Working..." : "Submit"}
            </button>
          </form>
        )}
        {result !== null && (
          <div className="mt-4 p-3 bg-gray-100 rounded border text-sm">
            <pre>{JSON.stringify(result as unknown, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
