"use client";
import { useState } from "react";
import {
    FeatureDonutChart,
    MonthPicker,
    OptimizationTips,
    PlanBadge,
    TeamLeaderboard,
    UpgradeCTA,
    UsageLineChart,
    ValueTiles,
} from "./components";
import { useAIUsageData } from "./useAIUsageData";

// TODO: Replace with real workspaceId and plan from auth/session

import { useWorkspace } from "@/lib/workspaceContext";

const { workspace } = useWorkspace();
const workspaceId: string = workspace?.id || "";
const plan = workspace?.plan?.key || "Pro";
const cap = 100000; // Example token cap

export default function AIUsagePage() {
  // Month key: YYYY-MM (default to current month)
  const [monthKey] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const {
    data: usageData,
    loading,
    error,
  } = useAIUsageData(workspaceId, monthKey);
  // TODO: Calculate nearCap from usageData
  const nearCap =
    cap && usageData
      ? usageData.reduce((sum, u) => sum + (u.tokens || 0), 0) > cap * 0.8
      : false;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Impact & Usage</h1>
        <PlanBadge plan={plan} />
      </header>
      <MonthPicker />
      <ValueTiles usageData={usageData} loading={loading} cap={cap} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        <UsageLineChart usageData={usageData} loading={loading} />
        <FeatureDonutChart usageData={usageData} loading={loading} />
      </div>
      <TeamLeaderboard usageData={usageData} loading={loading} />
      <div className="flex flex-col md:flex-row gap-8 mt-8">
        <OptimizationTips usageData={usageData} />
        {nearCap && <UpgradeCTA />}
      </div>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
}
