import React, { useEffect, useState } from "react";
import { getTopUserAndFeatureMTD } from "@/lib/aiDashboard";

export function Leaderboard({ workspaceId }: { workspaceId: string }) {
  const [topUser, setTopUser] = useState<{ uid: string; count: number } | null>(null);
  useEffect(() => {
    async function fetchLeaderboard() {
      const { topUser } = await getTopUserAndFeatureMTD(workspaceId);
      setTopUser(topUser);
    }
    if (workspaceId) fetchLeaderboard();
  }, [workspaceId]);

  if (!topUser) return <div className="p-4">No leaderboard data.</div>;
  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="font-semibold mb-2">Top User</h2>
      <div>User: {topUser.uid}</div>
      <div>Runs: {topUser.count}</div>
    </div>
  );
}
