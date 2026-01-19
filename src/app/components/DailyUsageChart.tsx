import React, { useEffect, useState } from "react";
import { collection, query, orderBy, startAt, endAt, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function DailyUsageChart({ workspaceId, monthStart, monthEnd }: { workspaceId: string; monthStart: string; monthEnd: string }) {
  const [data, setData] = useState<Array<{ dayKey: string; tokensIn: number }>>([]);
  useEffect(() => {
    async function fetchData() {
      const ref = collection(db, `workspaces/${workspaceId}/ai_rollups_daily`);
      const q = query(ref, orderBy("dayKey"), startAt(monthStart), endAt(monthEnd));
      const snap = await getDocs(q);
      setData(snap.docs.map(doc => ({ dayKey: doc.data().dayKey, tokensIn: doc.data().tokensIn })));
    }
    if (workspaceId) fetchData();
  }, [workspaceId, monthStart, monthEnd]);

  if (!data.length) return <div className="p-4">No daily usage data.</div>;
  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="font-semibold mb-2">Daily Usage</h2>
      <ul>
        {data.map(d => (
          <li key={d.dayKey}>{d.dayKey}: {d.tokensIn} tokens</li>
        ))}
      </ul>
    </div>
  );
}
