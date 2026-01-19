"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { EmptyStateInvoices } from "@/app/components/EmptyStates";

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "invoices")).then((snap) => {
      setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading…</div>;
  if (invoices.length === 0) return <EmptyStateInvoices />;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Invoices</h1>
      <ul>
        {invoices.map((inv, i) => {
          const invoice = inv as Record<string, unknown>;
          return (
            <li key={String(invoice.id) || i} className="mb-2 border-b pb-1">
              {invoice.name ? String(invoice.name) : String(invoice.id)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
