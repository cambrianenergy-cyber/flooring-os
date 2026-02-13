"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function FounderSystemHealth() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFounderUser, ready, user } = useFounderAuth();
  const founderUserId = user?.uid;
  if (!founderUserId) return <div>Missing founderUserId in context</div>;

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchSnapshots() {
      setLoading(true);
      // Fetch last 12 global snapshots for trend (monthly or daily, depending on frequency)
      const q = query(
        collection(db, `founder/${founderUserId}/globalSnapshots`),
        orderBy("createdAt", "desc"),
        limit(12),
      );
      const snap = await getDocs(q);
      setSnapshots(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).reverse(),
      ); // reverse for chronological order
      setLoading(false);
    }
    fetchSnapshots();
  }, [ready, isFounderUser, founderUserId]);

  if (!ready) return <div>Loading...</div>;
  if (!isFounderUser) return <div>Access denied.</div>;
  if (loading) return <div>Loading system health data...</div>;

  // For now, use the latest snapshot for current values
  const latest = snapshots[snapshots.length - 1] || {};
  // Placeholder fields for errors, webhooks, jobs (add to snapshot if available)
  const webhookFailures = latest.webhookFailures30d ?? "-";
  const failedJobs = latest.failedJobs30d ?? "-";
  const errorLogs = latest.errorLogs30d ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">System Health</h1>
      <div className="mb-4">
        <strong>Webhook Failures (30d):</strong> {webhookFailures}
        <br />
        <strong>Failed Jobs (30d):</strong> {failedJobs}
        <br />
        <strong>Error Logs (Top 5):</strong>
        <ul className="list-disc ml-6">
          {Array.isArray(errorLogs) && errorLogs.length > 0 ? (
            errorLogs.slice(0, 5).map((log, i) => <li key={i}>{log}</li>)
          ) : (
            <li>-</li>
          )}
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          System Health Trend (last {snapshots.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Webhook Failures</th>
                <th className="p-2 text-left">Failed Jobs</th>
                <th className="p-2 text-left">Error Logs</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">
                    {snap.createdAt && snap.createdAt.seconds
                      ? new Date(
                          snap.createdAt.seconds * 1000,
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-2">
                    {typeof snap.webhookFailures30d === "number"
                      ? snap.webhookFailures30d
                      : "-"}
                  </td>
                  <td className="p-2">
                    {typeof snap.failedJobs30d === "number"
                      ? snap.failedJobs30d
                      : "-"}
                  </td>
                  <td className="p-2">
                    {Array.isArray(snap.errorLogs30d) &&
                    snap.errorLogs30d.length > 0
                      ? snap.errorLogs30d.slice(0, 2).join(", ")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
