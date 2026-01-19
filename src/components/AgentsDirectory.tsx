import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { agentRegistry } from "@/app/api/ai/agents/registry";
import { estimatorAgent } from "@/app/api/ai/agents/estimator";
import { followUpAgent } from "@/app/api/ai/agents/followUp";
import { materialsAgent } from "@/app/api/ai/agents/materials";
import { jobSummaryAgent } from "@/app/api/ai/agents/jobSummary";
import { kpiAgent } from "@/app/api/ai/agents/kpi";
import { schedulingAgent } from "@/app/api/ai/agents/scheduling";
import { calendarAgent } from "@/app/api/ai/agents/calendar";
import { trainingTipsAgent } from "@/app/api/ai/agents/trainingTips";
import { remindersAgent } from "@/app/api/ai/agents/reminders";
import { leadScoringAgent } from "@/app/api/ai/agents/leadScoring";
import { documentGenAgent } from "@/app/api/ai/agents/documentGen";
import { workflowAgent } from "@/app/api/ai/agents/workflow";
import type { Product } from "@/lib/types";


export default function AgentsDirectory({ userRole }: { userRole: string }) {
  const router = useRouter();
  const showAgentDirectory = ["founder", "owner", "admin"].includes(userRole);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function makeDemoProduct(): Product {
    const now = Date.now();
    return {
      name: "Laminate Driftwood",
      brand: "Acme Floors",
      sku: "LAM-001",
      materialType: "Laminate",
      unit: "sqft",
      costPerSqft: 2.5,
      sellPricePerSqft: 3.5,
      images: [],
      accessories: ["underlayment"],
      createdAt: now,
      updatedAt: now,
    };
  }

  if (!showAgentDirectory) return null;

  const handleExecute = async (agentId: string) => {
    setError(null);
    setResult(null);
    try {
      const base: { userRole: string } = { userRole: "owner" };
      let res: unknown;
      switch (agentId) {
        case "estimator":
          {
            const demoProduct = makeDemoProduct();
            res = estimatorAgent({ ...base, sqft: 1000, product: demoProduct, accessories: demoProduct.accessories || [] });
          }
          break;
        case "followUp":
          res = followUpAgent({ ...base, customerName: "Jane Doe", estimateId: "est-123", preferredMethod: "sms" });
          break;
        case "materials":
          {
            const demoProduct = makeDemoProduct();
            res = materialsAgent({
              ...base,
              product: demoProduct,
              sqft: 500,
              accessories: demoProduct.accessories || [],
            });
          }
          break;
        case "jobSummary":
          res = jobSummaryAgent({
            ...base,
            jobName: "Smith Residence",
            rooms: ["Living Room", "Kitchen"],
            status: "scheduled",
          });
          break;
        case "kpi":
          res = kpiAgent({ ...base, scope: "business", data: undefined });
          break;
        case "scheduling":
          res = schedulingAgent({
            ...base,
            type: "install",
            preferredDate: "2025-02-01T09:00:00",
            durationMinutes: 120,
            calendar: "default",
          });
          break;
        case "calendar":
          res = calendarAgent({
            ...base,
            action: "read",
            eventType: "install",
            eventDetails: { location: "123 Main St", date: "2025-02-01T09:00:00" },
          });
          break;
        case "trainingTips":
          res = trainingTipsAgent({ ...base, topic: "LVP install" });
          break;
        case "reminders":
          res = remindersAgent({
            ...base,
            taskType: "job",
            dueDate: "2025-02-01T08:00:00",
            details: "Clock in by 8am",
          });
          break;
        case "leadScoring":
          res = leadScoringAgent({
            ...base,
            leads: [
              {
                name: "Jane Doe",
                source: "web",
                lastContact: "2025-12-30T10:00:00",
                value: 8000,
                status: "hot",
              },
            ],
          });
          break;
        case "documentGen":
          res = documentGenAgent({
            ...base,
            docType: "contract",
            data: { customerName: "Jane Doe", jobName: "Smith Residence", total: 12500 },
          });
          break;
        case "workflow":
          res = workflowAgent({ ...base, workflowType: "approval", data: { request: "Change order" } });
          break;
        default:
          res = { error: "Execution for this agent is not wired yet." };
      }
      setResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to execute agent");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-primary">AI Agents Directory</h2>
      <ul className="space-y-3">
        {agentRegistry.map((agent, idx) => {
          // Type guard for agent meta
          const hasLabel = typeof agent === "object" && "label" in agent && "description" in agent;
          if (!hasLabel) return null;
          return (
            <li key={agent.id ?? idx} className="border-soft rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between bg-card">
              <div>
                <div className="font-semibold text-lg text-primary">{agent.label}</div>
                <div className="text-secondary text-sm">{agent.description}</div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button
                  className="bg-input text-primary px-4 py-2 rounded font-semibold hover:brightness-110 transition border-soft"
                  onClick={() => router.push(`/app/ai?agent=${agent.id}`)}
                >
                  Open Agent
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {result && (
        <div className="mt-6 p-4 bg-card rounded border-soft">
          <h3 className="font-bold mb-2 text-primary">Execution Result</h3>
          <pre className="whitespace-pre-wrap text-sm text-secondary">{result}</pre>
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 rounded border border-red-400 bg-red-900/20 text-red-200 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}