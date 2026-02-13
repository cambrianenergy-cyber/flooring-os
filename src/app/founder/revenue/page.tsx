"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function FounderRevenue() {
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
  if (loading) return <div>Loading revenue data...</div>;

  const latest = snapshots[snapshots.length - 1] || {};
  const mrr = latest.totalMRRCents
    ? `$${(latest.totalMRRCents / 100).toLocaleString()}`
    : "-";
  const arr = latest.totalMRRCents
    ? `$${((latest.totalMRRCents * 12) / 100).toLocaleString()}`
    : "-";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Revenue Overview</h1>
      <div className="mb-4">
        <strong>Current MRR:</strong> {mrr}
        <br />
        <strong>Current ARR:</strong> {arr}
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          MRR Trend (last {snapshots.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">MRR</th>
                <th className="p-2 text-left">Revenue (Cumulative)</th>
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
                    {typeof snap.totalMRRCents === "number"
                      ? `$${(snap.totalMRRCents / 100).toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="p-2">
                    {typeof snap.totalRevenueCents === "number"
                      ? `$${(snap.totalRevenueCents / 100).toLocaleString()}`
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
