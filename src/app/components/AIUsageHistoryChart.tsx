"use client";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  workspaceId: string;
  monthKey?: string; // e.g. "2026-01"
}

export function AIUsageHistoryChart({ workspaceId, monthKey }: Props) {
  const [data, setData] = useState<{ day: string; tokens: number }[]>([]);
  useEffect(() => {
    async function fetchData() {
      const now = new Date();
      const mk = monthKey || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const q = query(
        collection(db, `workspaces/${workspaceId}/ai_events`),
        where("monthKey", "==", mk)
      );
      const snap = await getDocs(q);
      const dayMap: Record<string, number> = {};
      snap.forEach(doc => {
        const { dayKey, tokensIn } = doc.data();
        if (dayKey) dayMap[dayKey] = (dayMap[dayKey] || 0) + (tokensIn || 0);
      });
      const days = Object.keys(dayMap).sort();
      setData(days.map(day => ({ day, tokens: dayMap[day] })));
    }
    if (workspaceId) fetchData();
  }, [workspaceId, monthKey]);

  if (!data.length) return <div className="p-4">No usage this month.</div>;

  const chartData = {
    labels: data.map(d => d.day),
    datasets: [
      {
        label: "Tokens Used",
        data: data.map(d => d.tokens),
        fill: false,
        borderColor: "#6366f1",
        backgroundColor: "#6366f1",
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="border rounded p-4">
      <div className="font-bold mb-2">AI Usage History (Daily)</div>
      <Line data={chartData} options={{
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { title: { display: true, text: "Day" } }, y: { title: { display: true, text: "Tokens" } } }
      }} />
    </div>
  );
}
