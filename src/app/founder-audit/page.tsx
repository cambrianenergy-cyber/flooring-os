"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function FounderAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFounderUser, ready, user } = useFounderAuth();
  const founderUserId = user?.uid;
  if (!founderUserId) return <div>Missing founderUserId in context</div>;

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchLogs() {
      setLoading(true);
      // Fetch audit logs from Firestore
      const q = query(
        collection(db, "auditLogs"),
        where("founderUserId", "==", founderUserId),
        orderBy("createdAt", "desc"),
        limit(50),
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchLogs();
  }, [ready, isFounderUser, founderUserId]);

  if (!ready) return <div>Loading...</div>;
  if (!isFounderUser) return <div>Access denied.</div>;
  if (loading) return <div>Loading audit logs...</div>;

  return (
    <div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
      <div className="text-2xl font-semibold mb-4">Audit Log (Founder)</div>
      <table className="min-w-full text-sm border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Action</th>
            <th className="p-2 text-left">Entity</th>
            <th className="p-2 text-left">Actor</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Reason</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={i} className="border-t">
              <td className="p-2 font-semibold">{log.action}</td>
              <td className="p-2">{log.entity}</td>
              <td className="p-2">{log.actor}</td>
              <td className="p-2">{log.createdAt}</td>
              <td className="p-2">{log.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-neutral-600">
        Every critical change across the system — discounts, deletes, role
        changes, approvals.
      </p>
    </div>
  );
}
