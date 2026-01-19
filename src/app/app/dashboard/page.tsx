

"use client";

import React, { useState } from "react";
import RoomEstimateDemo from "@/components/RoomEstimateDemo";
import DashboardAgents from "./DashboardAgents";
import { CoreWorkflowPack } from "../../components/CoreWorkflowPack";
import { SalesAcceleratorPack } from "../../components/SalesAcceleratorPack";
import { EstimationPowerPack } from "../../components/EstimationPowerPack";
import { OperationsAutomationPack } from "../../components/OperationsAutomationPack";
import { FullWorkflowSuitePack } from "../../components/FullWorkflowSuitePack";
import { GrowthCommandPackPlaceholder, CompetitiveIntelligencePackPlaceholder } from "../../components/PremiumPackPlaceholders";
import Link from "next/link";

import { Leaderboard } from "@/app/components/Leaderboard";
import { FeatureUsageChart } from "@/app/components/FeatureUsageChart";
import { DailyUsageChart } from "@/app/components/DailyUsageChart";
import { OptimizationTips } from "@/app/components/OptimizationTips";
import { OwnerValueTiles } from "@/app/components/OwnerValueTiles";
import { useWorkspacePlanStatus } from "@/app/components/useWorkspacePlanStatus";
import { PlanStatusBanner } from "@/app/components/PlanStatusBanner";
import { FounderPlanStatusBanner } from "@/app/components/FounderPlanStatusBanner";
import { useUser } from "@/app/components/useUser";

import { FounderForceResetPassword } from "@/app/components/FounderForceResetPassword";
import { useIsFounder } from "@/app/components/useIsFounder";

export default function DashboardPage() {
  // TODO: Replace with real workspaceId and userRole from context/auth
  const workspaceId = "demo-workspace";
  const userRole = "owner";
  const [suiteAgentResult, setSuiteAgentResult] = useState<string | null>(null);
  const [suiteAgentLoading, setSuiteAgentLoading] = useState(false);
  const [suiteAgentError, setSuiteAgentError] = useState<string | null>(null);



  async function handleSuiteAgentTrigger(agentId: string) {
    setSuiteAgentResult(null);
    setSuiteAgentError(null);
    setSuiteAgentLoading(true);
    try {
      const res = await fetch("/api/ai/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          userRole,
          workspaceId,
          screenContext: "dashboard_full_workflow_suite_pack",
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setSuiteAgentResult(data.text);
      } else if (data.error) {
        setSuiteAgentError(data.error);
      } else {
        setSuiteAgentError("Unknown error from agent.");
      }
    } catch {
      setSuiteAgentError("Failed to contact orchestrator API.");
    }
    setSuiteAgentLoading(false);
  }
  const [agentResult, setAgentResult] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [salesAgentResult, setSalesAgentResult] = useState<string | null>(null);
  const [salesAgentLoading, setSalesAgentLoading] = useState(false);
  const [salesAgentError, setSalesAgentError] = useState<string | null>(null);
  const [estimationAgentResult, setEstimationAgentResult] = useState<string | null>(null);
  const [estimationAgentLoading, setEstimationAgentLoading] = useState(false);
  const [estimationAgentError, setEstimationAgentError] = useState<string | null>(null);
  const [opsAgentResult, setOpsAgentResult] = useState<string | null>(null);
  const [opsAgentLoading, setOpsAgentLoading] = useState(false);
  const [opsAgentError, setOpsAgentError] = useState<string | null>(null);
    async function handleOpsAgentTrigger(agentId: string) {
      setOpsAgentResult(null);
      setOpsAgentError(null);
      setOpsAgentLoading(true);
      try {
        const res = await fetch("/api/ai/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            userRole,
            workspaceId,
            screenContext: "dashboard_operations_automation_pack",
          }),
        });
        const data = await res.json();
        if (res.ok && data.text) {
          setOpsAgentResult(data.text);
        } else if (data.error) {
          setOpsAgentError(data.error);
        } else {
          setOpsAgentError("Unknown error from agent.");
        }
      } catch {
        setOpsAgentError("Failed to contact orchestrator API.");
      }
      setOpsAgentLoading(false);
    }
  async function handleEstimationAgentTrigger(agentId: string) {
    setEstimationAgentResult(null);
    setEstimationAgentError(null);
    setEstimationAgentLoading(true);
    try {
      const res = await fetch("/api/ai/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          userRole,
          workspaceId,
          screenContext: "dashboard_estimation_power_pack",
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setEstimationAgentResult(data.text);
      } else if (data.error) {
        setEstimationAgentError(data.error);
      } else {
        setEstimationAgentError("Unknown error from agent.");
      }
    } catch {
      setEstimationAgentError("Failed to contact orchestrator API.");
    }
    setEstimationAgentLoading(false);
  }



  async function handleCoreAgentTrigger(agentId: string) {
    setAgentResult(null);
    setAgentError(null);
    setAgentLoading(true);
    try {
      const res = await fetch("/api/ai/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          userRole,
          workspaceId,
          screenContext: "dashboard_core_workflow_pack",
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setAgentResult(data.text);
      } else if (data.error) {
        setAgentError(data.error);
      } else {
        setAgentError("Unknown error from agent.");
      }
    } catch {
      setAgentError("Failed to contact orchestrator API.");
    }
    setAgentLoading(false);
  }

  async function handleSalesAgentTrigger(agentId: string) {
    setSalesAgentResult(null);
    setSalesAgentError(null);
    setSalesAgentLoading(true);
    try {
      const res = await fetch("/api/ai/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          userRole,
          workspaceId,
          screenContext: "dashboard_sales_accelerator_pack",
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setSalesAgentResult(data.text);
      } else if (data.error) {
        setSalesAgentError(data.error);
      } else {
        setSalesAgentError("Unknown error from agent.");
      }
    } catch {
      setSalesAgentError("Failed to contact orchestrator API.");
    }
    setSalesAgentLoading(false);
  }

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
  const plan = useWorkspacePlanStatus(workspaceId);
  const user = useUser();
  function getUserEmail(u: unknown): string | undefined {
    if (u && typeof u === 'object' && 'email' in u && typeof (u as { email?: unknown }).email === 'string') {
      return (u as { email: string }).email;
    }
    return undefined;
  }
  const email = getUserEmail(user);
  const isFounder = useIsFounder(email);
  return (
    <div>
      <div className="p-6 space-y-6">
        {isFounder ? (
          <>
            <FounderPlanStatusBanner />
            <FounderForceResetPassword />
          </>
        ) : plan && (
          <PlanStatusBanner planKey={plan.key} status={plan.status} currentPeriodEnd={plan.currentPeriodEnd} />
        )}
        <OwnerValueTiles workspaceId={workspaceId} />
        <FullWorkflowSuitePack onTrigger={handleSuiteAgentTrigger} />
        {suiteAgentLoading && (
          <div className="my-4 p-3 bg-yellow-100 text-yellow-700 rounded">Running suite agent…</div>
        )}
        {suiteAgentResult && (
          <div className="my-4 p-3 bg-green-100 text-green-800 rounded whitespace-pre-line">{suiteAgentResult}</div>
        )}
        {suiteAgentError && (
          <div className="my-4 p-3 bg-red-100 text-red-800 rounded">{suiteAgentError}</div>
        )}
        <CoreWorkflowPack onTrigger={handleCoreAgentTrigger} />
        {agentLoading && (
          <div className="my-4 p-3 bg-blue-100 text-blue-700 rounded">Running agent…</div>
        )}
        {agentResult && (
          <div className="my-4 p-3 bg-green-100 text-green-800 rounded whitespace-pre-line">{agentResult}</div>
        )}
        {agentError && (
          <div className="my-4 p-3 bg-red-100 text-red-800 rounded">{agentError}</div>
        )}

        <SalesAcceleratorPack onTrigger={handleSalesAgentTrigger} />
        {salesAgentLoading && (
          <div className="my-4 p-3 bg-pink-100 text-pink-700 rounded">Running sales agent…</div>
        )}
        {salesAgentResult && (
          <div className="my-4 p-3 bg-green-100 text-green-800 rounded whitespace-pre-line">{salesAgentResult}</div>
        )}
        {salesAgentError && (
          <div className="my-4 p-3 bg-red-100 text-red-800 rounded">{salesAgentError}</div>
        )}

        <EstimationPowerPack onTrigger={handleEstimationAgentTrigger} />
        {estimationAgentLoading && (
          <div className="my-4 p-3 bg-purple-100 text-purple-700 rounded">Running estimation agent…</div>
        )}
        {estimationAgentResult && (
          <div className="my-4 p-3 bg-green-100 text-green-800 rounded whitespace-pre-line">{estimationAgentResult}</div>
        )}
        {estimationAgentError && (
          <div className="my-4 p-3 bg-red-100 text-red-800 rounded">{estimationAgentError}</div>
        )}

        <OperationsAutomationPack onTrigger={handleOpsAgentTrigger} />
        <GrowthCommandPackPlaceholder />
        <CompetitiveIntelligencePackPlaceholder />
        {opsAgentLoading && (
          <div className="my-4 p-3 bg-orange-100 text-orange-700 rounded">Running operations agent…</div>
        )}
        {opsAgentResult && (
          <div className="my-4 p-3 bg-green-100 text-green-800 rounded whitespace-pre-line">{opsAgentResult}</div>
        )}
        {opsAgentError && (
          <div className="my-4 p-3 bg-red-100 text-red-800 rounded">{opsAgentError}</div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex gap-2">
            <Link
              href="/app"
              className="px-3 py-2 rounded border text-sm hover:bg-neutral-50 cursor-pointer"
            >
              App Home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded p-4">
            <h2 className="font-medium mb-2">Quick Actions</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <Link className="underline cursor-pointer" href="/app/workspaces">
                  Workspaces
                </Link>
              </li>
              <li>
                <Link className="underline cursor-pointer" href="/app/team">
                  Team
                </Link>
              </li>
              <li>
                <Link className="underline cursor-pointer" href="/app/agents">
                  Agents
                </Link>
              </li>
            </ul>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-medium mb-2">Status</h2>
            <div>OK</div>
          </div>
        </div>
      </div>
      {/* New dashboard widgets */}
      <div className="p-6 grid gap-4 md:grid-cols-2">
        <Leaderboard workspaceId={workspaceId} />
        <FeatureUsageChart workspaceId={workspaceId} />
        <DailyUsageChart workspaceId={workspaceId} monthStart={monthStart} monthEnd={monthEnd} />
        <OptimizationTips />
      </div>
      <DashboardAgents />
      <RoomEstimateDemo />
    </div>
  );
}
