
"use client";
import React, { useState } from "react";
import { AGENT_REGISTRY } from "./agentRegistry";
import Modal from "./Modal";

export default function AIAgentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  type Agent = typeof AGENT_REGISTRY[number];
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<null | Record<string, any>>(null);
  const [loading, setLoading] = useState(false);

  // Define dynamic fields for each agent (simple demo, expand as needed)
  const agentFields: { [key: string]: { name: string; label: string; type: string }[] } = {
    estimator: [
      { name: "sqft", label: "Square Feet", type: "number" },
      { name: "product", label: "Product Name", type: "text" },
      { name: "accessories", label: "Accessories (comma separated)", type: "text" },
    ],
    followUp: [
      { name: "customerName", label: "Customer Name", type: "text" },
      { name: "estimateId", label: "Estimate ID", type: "text" },
      { name: "preferredMethod", label: "Preferred Method (sms/email)", type: "text" },
    ],
    materials: [
      { name: "product", label: "Product Name", type: "text" },
      { name: "sqft", label: "Square Feet", type: "number" },
      { name: "accessories", label: "Accessories (comma separated)", type: "text" },
    ],
    jobSummary: [
      { name: "jobName", label: "Job Name", type: "text" },
      { name: "rooms", label: "Rooms (comma separated)", type: "text" },
      { name: "status", label: "Status", type: "text" },
    ],
    kpi: [
      { name: "scope", label: "Scope (job/rep/business)", type: "text" },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      // Always include agentType in the request body
      const payload = { ...formData, agentType: selectedAgent?.id };
      const res = await fetch(`/api/ai/agents/${selectedAgent?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to contact agent." });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-app p-4">
      <div className="w-full max-w-2xl bg-surface rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-primary">AI Agents</h1>
        <p className="mb-6 text-secondary">Manage and interact with your AI-powered agents below.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AGENT_REGISTRY.filter(agent => !["inbox", "leadScoring", "workflow"].includes(agent.id)).map(agent => (
            <div key={agent.id} className="border-soft rounded-lg p-4 shadow-sm flex flex-col justify-between bg-card">
              <div>
                <div className="font-semibold text-lg mb-1 text-primary">{agent.label}</div>
                <div className="text-secondary mb-3 text-sm">{agent.description}</div>
              </div>
              <button
                className="mt-auto bg-input text-primary px-4 py-2 rounded font-semibold hover:brightness-110 transition border-soft"
                onClick={() => handleOpenModal(agent)}
              >
                Interact
              </button>
            </div>
          ))}
        </div>
      </div>
      <Modal open={modalOpen} onClose={handleCloseModal} title={selectedAgent?.label || ""}>
        {selectedAgent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {(agentFields[selectedAgent.id] || []).map(field => (
              <div key={field.name}>
                <label className="block font-medium mb-1 text-primary">{field.label}</label>
                <input
                  name={field.name}
                  type={field.type}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className="w-full bg-input text-primary border-soft rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              className="bg-input text-primary px-4 py-2 rounded font-semibold hover:brightness-110 transition border-soft"
              disabled={loading}
            >
              {loading ? "Working..." : "Submit"}
            </button>
          </form>
        )}
        {result && (
          <div className="mt-4 p-3 bg-card rounded border-soft text-sm">
            <pre className="text-secondary">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
