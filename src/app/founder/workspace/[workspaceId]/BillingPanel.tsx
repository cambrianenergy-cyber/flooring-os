import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function BillingPanel({ workspaceId }: { workspaceId: string }) {
  const [billing, setBilling] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const billingRef = doc(db, `workspaces/${workspaceId}/billing/default`);
        const billingSnap = await getDoc(billingRef);
        setBilling(billingSnap.exists() ? billingSnap.data() : null);
      } catch {
        setBilling(null);
      }
      setLoading(false);
    }
    fetchBilling();
  }, [workspaceId]);

  if (loading) return <div>Loading billing info...</div>;
  if (!billing) return <div>No billing info found.</div>;

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Billing</h3>
      <div className="mb-2">
        <span className="font-semibold">Status:</span> {billing.status || "-"}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Next Renewal:</span>{" "}
        {billing.nextRenewalDate
          ? new Date(
              billing.nextRenewalDate.seconds
                ? billing.nextRenewalDate.seconds * 1000
                : billing.nextRenewalDate,
            ).toLocaleDateString()
          : "-"}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Current Plan:</span>{" "}
        {billing.plan || "-"}
      </div>
    </div>
  );
}
