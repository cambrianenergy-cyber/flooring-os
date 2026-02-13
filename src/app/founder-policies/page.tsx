"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function FounderPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFounderUser, ready, user } = useFounderAuth();
  const founderUserId = user?.uid;
  if (!founderUserId) return <div>Missing founderUserId in context</div>;

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchPolicies() {
      setLoading(true);
      // Fetch policies from Firestore
      const q = query(
        collection(db, "policies"),
        where("founderUserId", "==", founderUserId),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setPolicies([]);
      } else {
        setPolicies(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    }
    fetchPolicies();
  }, [ready, isFounderUser, founderUserId]);

  if (!ready) return <div>Loading...</div>;
  if (!isFounderUser) return <div>Access denied.</div>;
  if (loading) return <div>Loading policy data...</div>;

  return (
    <div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
      <div className="text-2xl font-semibold mb-4">Policy Engine (Founder)</div>
      <table className="min-w-full text-sm border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Policy</th>
            <th className="p-2 text-left">Value</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy, i) => (
            <tr key={i} className="border-t">
              <td className="p-2 font-semibold">{policy.name}</td>
              <td className="p-2">{policy.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-neutral-600">
        Set margin floors, discount caps, approval routing, and override rules.
      </p>
    </div>
  );
}
