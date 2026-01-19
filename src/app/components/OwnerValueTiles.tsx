import React, { useEffect, useState } from "react";
import { getAIActionsCompletedMTD, getEstimatedHoursSavedMTD, getRevenueInfluencedMTD } from "@/lib/aiDashboard";

export function OwnerValueTiles({ workspaceId }: { workspaceId: string }) {
  const [actions, setActions] = useState<Record<string, number>>({});
  const [hoursSaved, setHoursSaved] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  useEffect(() => {
    async function fetchData() {
      const acts = await getAIActionsCompletedMTD(workspaceId);
      setActions(acts);
      setHoursSaved(await getEstimatedHoursSavedMTD(workspaceId));
      setRevenue(await getRevenueInfluencedMTD(workspaceId));
    }
    if (workspaceId) fetchData();
  }, [workspaceId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="border rounded p-4">
        <div className="font-bold text-lg mb-1">AI Actions</div>
        <div>Estimate drafts: {actions.estimate_assist ?? 0}</div>
        <div>Scope builds: {actions.scope_builder ?? 0}</div>
        <div>Followup drafts: {actions.followup_draft ?? 0}</div>
      </div>
      <div className="border rounded p-4">
        <div className="font-bold text-lg mb-1">Time Saved</div>
        <div>{hoursSaved.toFixed(1)} hours saved this month</div>
      </div>
      <div className="border rounded p-4">
        <div className="font-bold text-lg mb-1">Pipeline Influenced</div>
        <div>${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} approved pipeline influenced</div>
      </div>
    </div>
  );
}
