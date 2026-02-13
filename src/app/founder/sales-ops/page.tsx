"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function FounderSalesOps() {
  type Metrics = {
    id: string;
    date?: string;
    estimates?: number;
    contracts?: number;
    wins?: number;
    agentRuns?: number;
    mrrCents?: number;
    revenueCents?: number;
    pastDueCount?: number;
    docusignStuckCount?: number;
  };

  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFounderUser, ready, user } = useFounderAuth();
  const founderUserId = user?.uid;
  if (!founderUserId) return <div>Missing founderUserId in context</div>;

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchMetrics() {
      setLoading(true);
      // Fetch metricsDaily time-series for this founder
      const q = query(
        collection(db, `founder/${founderUserId}/metricsDaily`),
        orderBy("date", "asc"),
      );
      const snap = await getDocs(q);
      setMetrics(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchMetrics();
  }, [ready, isFounderUser, founderUserId]);

  if (!ready) return <div>Loading...</div>;
  if (!isFounderUser) return <div>Access denied.</div>;
  if (loading) return <div>Loading sales ops data...</div>;

  // Use the latest metrics for current values
  const latest = metrics[metrics.length - 1] || {};
  const estimates = latest.estimates ?? "-";
  const contracts = latest.contracts ?? "-";
  const wins = latest.wins ?? "-";
  let closeRate = "-";
  if (
    typeof estimates === "number" &&
    typeof wins === "number" &&
    estimates > 0
  ) {
    closeRate = `${((wins / estimates) * 100).toFixed(1)}%`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sales Operations</h1>
      <div className="mb-4">
        <strong>Estimates (30d):</strong> {estimates}
        <br />
        <strong>Contracts (30d):</strong> {contracts}
        <br />
        <strong>Wins (30d):</strong> {wins}
        <br />
        <strong>Close Rate:</strong> {closeRate}
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Sales Trend (last {metrics.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Estimates</th>
                <th className="p-2 text-left">Contracts</th>
                <th className="p-2 text-left">Wins</th>
                <th className="p-2 text-left">Close Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => {
                const e = m.estimates ?? null;
                const w = m.wins ?? null;
                let cr = "-";
                if (typeof e === "number" && typeof w === "number" && e > 0) {
                  cr = `${((w / e) * 100).toFixed(1)}%`;
                }
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2">{m.date || "-"}</td>
                    <td className="p-2">
                      {typeof m.estimates === "number" ? m.estimates : "-"}
                    </td>
                    <td className="p-2">
                      {typeof m.contracts === "number" ? m.contracts : "-"}
                    </td>
                    <td className="p-2">
                      {typeof m.wins === "number" ? m.wins : "-"}
                    </td>
                    <td className="p-2">{cr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
