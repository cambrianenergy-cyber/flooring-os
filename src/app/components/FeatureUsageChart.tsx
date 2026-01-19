import React, { useEffect, useState } from "react";
import { getTopUserAndFeatureMTD } from "@/lib/aiDashboard";

export function FeatureUsageChart({ workspaceId }: { workspaceId: string }) {
  const [topFeature, setTopFeature] = useState<{ featureKey: string; count: number } | null>(null);
  useEffect(() => {
    async function fetchFeatureUsage() {
      const { topFeature } = await getTopUserAndFeatureMTD(workspaceId);
      setTopFeature(topFeature);
    }
    if (workspaceId) fetchFeatureUsage();
  }, [workspaceId]);

  if (!topFeature) return <div className="p-4">No feature usage data.</div>;
  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="font-semibold mb-2">Top Feature</h2>
      <div>Feature: {topFeature.featureKey}</div>
      <div>Runs: {topFeature.count}</div>
    </div>
  );
}
