"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { EmptyStateEstimates } from "@/app/components/EmptyStates";

export default function EstimatesListPage() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "estimates")).then((snap) => {
      setEstimates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading…</div>;
  if (estimates.length === 0) return <EmptyStateEstimates />;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Estimates</h1>
      <ul>
        {estimates.map(estimate => (
          <li key={estimate.id} className="mb-2 border-b pb-1">
            {estimate.name || estimate.id}
          </li>
        ))}
      </ul>
    </div>
  );
}
