"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

// Dummy loadOnboarding function for demonstration. Replace with your actual import.
async function loadOnboarding() {
  // ...fetch onboarding data from Firestore or API
  return null; // or return onboarding data object
}


const recentJobs = [
  { id: "J1001", title: "Install LVP - Main St.", status: "in_progress" },
  { id: "J1002", title: "Tile Kitchen - Oak Ave.", status: "scheduled" },
  { id: "J1003", title: "Carpet Bedroom - Pine Rd.", status: "complete" },
];
const stats = {
  jobs: 12,
  estimates: 7,
  leads: 5,
  contacts: 20,
};
const notifications = [
  { id: 1, message: "Estimate #E2001 approved.", type: "success" },
  { id: 2, message: "New lead: John Doe.", type: "info" },
  { id: 3, message: "Job #J1002 scheduled for tomorrow.", type: "reminder" },
];
const quickLinks = [
  { href: "/estimates", label: "Estimates" },
  { href: "/leads", label: "Leads" },
  { href: "/contacts", label: "Contacts" },
];

const AI_ACTION_COSTS = [
  {
    pack: "Core Workflow Agents",
    color: "blue",
    agents: [
      { label: "Job Intake Agent", cost: 1, unit: "run", why: "Structured extraction, low reasoning depth.", dollar: 0.04 },
      { label: "Scheduling Agent", cost: 1, unit: "run", why: "Rule-based logic + light optimization.", dollar: 0.04 },
      { label: "Material Prep Agent", cost: 2, unit: "run", why: "Calculations + waste buffers + material logic.", dollar: 0.08 },
      { label: "Job Organizer Agent", cost: 1, unit: "run", why: "Classification, tagging, alerts.", dollar: 0.04 },
    ],
  },
  {
    pack: "Sales Accelerator Pack",
    color: "pink",
    agents: [
      { label: "Lead Qualification Agent", cost: 1, unit: "lead", why: "Scoring + intent detection.", dollar: 0.04 },
      { label: "Proposal Writing Agent", cost: 3, unit: "proposal", why: "Natural language generation + tone control.", dollar: 0.12 },
      { label: "Follow-Up Agent", cost: 1, unit: "follow-up", why: "Script generation, low context depth.", dollar: 0.04 },
      { label: "Close Rate Analyst", cost: 5, unit: "analysis run", why: "Cross-job pattern recognition + historical comparison.", dollar: 0.20 },
    ],
  },
  {
    pack: "Estimation Power Pack",
    color: "purple",
    agents: [
      { label: "Smart Estimator Agent", cost: 4, unit: "estimate", why: "Layout logic + normalization + sqft complexity.", dollar: 0.16 },
      { label: "Pricing Optimizer Agent", cost: 5, unit: "optimization", why: "Margin logic + historical job comparison.", dollar: 0.20 },
      { label: "Margin Guard Agent", cost: 3, unit: "check", why: "Cost structure validation + risk detection.", dollar: 0.12 },
      { label: "Estimate Comparator Agent", cost: 6, unit: "comparison", why: "Multi-estimate analysis + probability modeling.", dollar: 0.24 },
    ],
  },
  {
    pack: "Operations Automation Pack",
    color: "orange",
    agents: [
      { label: "Workflow Automation Agent", cost: 1, unit: "transition", why: "Event-driven logic, minimal reasoning.", dollar: 0.04 },
      { label: "Compliance Agent", cost: 2, unit: "audit", why: "Checklist logic + rule verification.", dollar: 0.08 },
      { label: "Crew Coordination Agent", cost: 3, unit: "assignment", why: "Resource balancing + efficiency logic.", dollar: 0.12 },
      { label: "Delay Detection Agent", cost: 2, unit: "scan", why: "Timeline analysis + anomaly detection.", dollar: 0.08 },
    ],
  },
  {
    pack: "Full Suite / Advanced Intelligence",
    color: "teal",
    agents: [
      { label: "Business Intelligence Agent (Suite-Only)", cost: 8, unit: "report", why: "Cross-domain reasoning (sales + ops + estimates).", dollar: 0.32 },
    ],
  },
  {
    pack: "Elite / Premium Agents (Future-Proofed)",
    color: "yellow",
    agents: [
      { label: "Market Expansion Agent", cost: 10, unit: "analysis", why: "", dollar: 0.40 },
      { label: "Competitive Intelligence Agent", cost: 12, unit: "report", why: "", dollar: 0.48 },
      { label: "Hiring Readiness Agent", cost: 6, unit: "assessment", why: "", dollar: 0.24 },
    ],
  },
];

export default function DashboardPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [aiUsage, setAiUsage] = useState<{ used: number; quota: number; planKey: string } | null>(null);
  const [perAgent, setPerAgent] = useState<Array<{ agentId: string; runs: number }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  // TODO: Replace with real workspaceId from auth/session
  const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("workspaceId") || "demo" : "demo";

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const data = await loadOnboarding();
        if (!data) {
          setError("Onboarding not initialized.");
          return;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return;
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/ai-usage?workspaceId=${encodeURIComponent(workspaceId)}`);
        if (!res.ok) throw new Error("Failed to fetch usage");
        const data = await res.json();
        setAiUsage(data.usage || null);
        setPerAgent(data.perAgent || null);
      } catch {
        setAiUsage(null);
        setPerAgent(null);
      }
    })();
  }, [workspaceId]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-6 rounded shadow text-center">
          <h1 className="text-2xl font-bold mb-2">Onboarding Error</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page-bg text-foreground p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {/* AI Action Usage Meter */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <span role="img" aria-label="chip">💡</span> AI Action Usage
        </h2>
        {aiUsage ? (
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{aiUsage.used.toLocaleString()} / {aiUsage.quota.toLocaleString()}</span> actions used this month
            <span className="ml-2 text-xs text-gray-500">(Plan: {aiUsage.planKey})</span>
            {/* Overage billing info */}
            {process.env.NEXT_PUBLIC_AI_OVERAGE_ENABLED === "true" && (
              <div className="mt-1 text-xs text-blue-700 font-semibold flex items-center gap-2">
                <span role="img" aria-label="money">💸</span> Overage actions will be billed at <span className="font-bold">$0.40</span> each.
              </div>
            )}
            <div className="w-full bg-gray-200 rounded h-2 mt-2">
              <div
                className={`h-2 rounded usage-bar ${aiUsage.used / aiUsage.quota >= 0.9 ? 'bg-red-500' : aiUsage.used / aiUsage.quota >= 0.7 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                data-width={Math.min(100, (aiUsage.used / aiUsage.quota) * 100)}
              />
            </div>
            {/* Alerts and upgrade prompts */}
            {aiUsage.used / aiUsage.quota >= 1 && (
              <div className="mt-2 text-red-600 font-semibold flex items-center gap-2">
                <span role="img" aria-label="alert">⛔</span> You have reached your monthly AI action limit. <Link href="/billing" className="underline text-blue-700 ml-2">Upgrade Plan</Link>
              </div>
            )}
            {aiUsage.used / aiUsage.quota >= 0.9 && aiUsage.used / aiUsage.quota < 1 && (
              <div className="mt-2 text-red-500 font-semibold flex items-center gap-2">
                <span role="img" aria-label="warning">⚠️</span> Nearing your monthly AI action limit. <Link href="/billing" className="underline text-blue-700 ml-2">Upgrade Plan</Link>
              </div>
            )}
            {aiUsage.used / aiUsage.quota >= 0.7 && aiUsage.used / aiUsage.quota < 0.9 && (
              <div className="mt-2 text-yellow-600 font-semibold flex items-center gap-2">
                <span role="img" aria-label="info">ℹ️</span> 70%+ of your monthly AI actions used.
              </div>
            )}
            {/* Usage breakdown */}
            <div className="mt-2 text-xs text-gray-500">
              <div>Each agent run deducts actions based on complexity. See cost map below.</div>
              <div>Usage resets monthly. <Link href="/billing" className="underline">See plan details</Link>.</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400">Loading usage...</div>
        )}
      </section>
      {/* Per-Agent Usage Breakdown */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <span role="img" aria-label="robot">🤖</span> Per-Agent Usage (This Month)
        </h2>
        {perAgent ? (
          perAgent.length > 0 ? (
            <table className="w-full text-sm border rounded bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Agent</th>
                  <th className="p-2 text-left">Runs</th>
                </tr>
              </thead>
              <tbody>
                {perAgent.map(row => (
                  <tr key={row.agentId} className="border-t">
                    <td className="p-2 font-mono">{row.agentId}</td>
                    <td className="p-2">{row.runs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-gray-500">No agent runs this month.</div>
          )
        ) : (
          <div className="text-xs text-gray-400">Loading per-agent usage...</div>
        )}
      </section>
      {/* AI Action Cost Map */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span role="img" aria-label="brain">🧠</span> AI Action Cost Map
        </h2>
        <div className="text-gray-700 mb-2 text-sm">
          <strong>How AI Actions Are Counted:</strong> Actions are charged based on data processed, reasoning depth, and business impact. Some agents are light-touch, some are heavy intelligence. This prevents abuse and protects margins.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AI_ACTION_COSTS.map(pack => (
            <div key={pack.pack} className={`border-2 border-${pack.color}-300 bg-${pack.color}-50 rounded-lg p-4`}>
              <div className={`font-semibold text-lg mb-2 text-${pack.color}-700`}>{pack.pack}</div>
              <ul className="mb-2">
                {pack.agents.map(agent => (
                  <li key={agent.label} className="mb-2">
                    <span className="font-medium">{agent.label}</span>
                    <span className="ml-2 text-xs text-gray-600">Cost: <span className="font-bold">{agent.cost} AI action{agent.cost > 1 ? 's' : ''} / {agent.unit}</span> <span className="ml-1 text-green-700">(${agent.dollar.toFixed(2)})</span></span>
                    <div className="text-xs text-gray-500 ml-1">Why: {agent.why}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Stats */}
        <div className="bg-page-surface rounded-lg shadow p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.jobs}</div>
              <div className="text-muted">Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.estimates}</div>
              <div className="text-muted">Estimates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.leads}</div>
              <div className="text-muted">Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.contacts}</div>
              <div className="text-muted">Contacts</div>
            </div>
          </div>
        </div>
        {/* Recent Jobs */}
        <div className="bg-page-surface rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
          <ul>
            {recentJobs.map(job => (
              <li key={job.id} className="mb-3 flex justify-between items-center cursor-pointer hover:bg-page-bg rounded" onClick={() => setSelectedJob(job.id)}>
                <span className="font-medium">{job.title}</span>
                <span className={`px-2 py-1 rounded text-xs ${job.status === "complete" ? "bg-green-100 text-green-700" : job.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>{job.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
          {selectedJob && (
            <div className="mt-4 p-4 bg-page-bg rounded shadow">
              <div className="font-semibold mb-2">Job Details</div>
              <div>Title: {recentJobs.find(j => j.id === selectedJob)?.title}</div>
              <div>Status: {recentJobs.find(j => j.id === selectedJob)?.status}</div>
              <div className="mt-3 flex gap-2">
                <button className="bg-accent text-background rounded-md p-2 font-medium" onClick={() => alert("Status updated!")}>Update Status</button>
                <button className="bg-accent text-background rounded-md p-2 font-medium" onClick={() => alert("Estimate sent!")}>Send Estimate</button>
                <button className="bg-accent text-background rounded-md p-2 font-medium" onClick={() => alert("Crew notified!")}>Coordinate Crew</button>
              </div>
            </div>
          )}
        </div>
        {/* Notifications / Tasks */}
        <div className="bg-page-surface rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <ul>
            {notifications.map(note => (
              <li key={note.id} className="mb-2">
                <span className={`px-2 py-1 rounded text-xs ${note.type === "success" ? "bg-green-100 text-green-700" : note.type === "info" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{note.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Quick Links */}
      <div className="bg-page-surface rounded-lg shadow p-6 flex gap-6 justify-center">
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href} className="px-4 py-2 bg-accent text-white rounded font-semibold hover:bg-accent/80 transition">
            {link.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
