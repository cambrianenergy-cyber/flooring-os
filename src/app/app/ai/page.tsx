"use client";
import React, { useState } from "react";
import useSWR from "swr";

type AIMessage = {
  role: string;
  text: string;
  actions?: { label: string }[];
};

const QUICK_ACTIONS = [
  { label: "Build Estimate", value: "build_estimate" },
  { label: "Write Follow-Up Text", value: "followup_text" },
  { label: "Create Material List", value: "material_list" },
  { label: "Summarize Job", value: "summarize_job" },
  { label: "KPI Breakdown", value: "kpi_breakdown" },
];

type FetcherArgs = {
  url: string;
  role: string;
};


type Agent = {
  id: string;
  label: string;
  description: string;
};

const fetcher = async ({ url, role }: FetcherArgs): Promise<Agent[]> => {
  const res = await fetch(`${url}?userRole=${role}`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
};

export default function AIHomeScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: "ai", text: "Hi! I’m your Flooring AI Assistant. What do you need?" },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    setMessages((msgs) => [...msgs, { role: "user", text }]);
    setLoading(true);
    try {
      // Example: get userRole, screenContext, allowedDataScopes from session/context
      const userRole = "rep"; // TODO: Replace with real user role
      const screenContext = "ai_home"; // TODO: Replace with real context if needed
      const allowedDataScopes = ["products", "jobs", "estimates"];
      const res = await fetch("/api/ai/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: text,
          userRole,
          screenContext,
          allowedDataScopes,
        }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: "ai", text: data.text, actions: data.actions }]);
    } catch {
      setMessages((msgs) => [...msgs, { role: "ai", text: "Sorry, there was an error contacting the AI." }]);
    }
    setLoading(false);
  };

  const handleQuickAction = (action: string) => {
    handleSend(action.replace(/_/g, " "));
  };

  const userRole = "rep"; // TODO: Replace with real user role
  // Fetch agent registry if user is founder/owner/admin
  const showAgentRegistry = ["founder", "owner", "admin"].includes(userRole);
    const { data: agentRegistry } = useSWR(
      showAgentRegistry ? { url: "/api/ai/agents", role: userRole } : null,
      fetcher
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6">
        {showAgentRegistry && agentRegistry && Array.isArray(agentRegistry) && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Available AI Agents</h2>
            <ul className="list-disc pl-6">
              {(agentRegistry as Agent[]).map((agent) => (
                <li key={agent.id} className="mb-1">
                  <span className="font-semibold">{agent.label}:</span> {agent.description}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.value}
                className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-blue-700 transition"
                onClick={() => handleQuickAction(a.label)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 overflow-y-auto bg-gray-50 rounded p-3 mb-4 border">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.role === "user" ? "bg-blue-100 text-right" : "bg-gray-200 text-left"}`}>
                {msg.text}
                {msg.actions && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {msg.actions.map((a, i) => (
                      <button key={i} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700 transition">{a.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="text-gray-400 text-center">AI is thinking…</div>}
        </div>
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            if (input.trim()) {
              handleSend(input.trim());
              setInput("");
            }
          }}
        >
          <input
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="What do you need?"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700 transition"
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
