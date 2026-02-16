"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function money(n?: number) {
  if (typeof n !== "number") return "-";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

type FirestoreDate = Date | { toDate: () => Date };
function daysOverdue(dueDate?: FirestoreDate) {
  if (!dueDate) return 0;
  const due =
    typeof dueDate === "object" && "toDate" in dueDate
      ? dueDate.toDate()
      : dueDate;
  const diff = Date.now() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Server actions removed for static export. UI actions are now stubs.

// Stub function for setInvoiceStatus
export async function setInvoiceStatusStub() {
  alert("Set invoice status is not available in static export.");
}

export type Invoice = {
  id: string;
  invoiceNumber?: string;
  customerName?: string;
  dueDate?: FirestoreDate;
  status?: "draft" | "sent" | "partial" | "paid" | "overdue";
  balanceDue?: number;
  total?: number;
  stripePaymentLink?: string;
};

export default function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const aging = useMemo(() => {
    const buckets = { "0-7": 0, "8-14": 0, "15-30": 0, "30+": 0 };
    for (const inv of invoices) {
      if (inv.status === "paid") continue;
      const d = daysOverdue(inv.dueDate);
      const amt =
        typeof inv.balanceDue === "number"
          ? inv.balanceDue
          : typeof inv.total === "number"
            ? inv.total
            : 0;
      if (d <= 7) buckets["0-7"] += amt;
      else if (d <= 14) buckets["8-14"] += amt;
      else if (d <= 30) buckets["15-30"] += amt;
      else buckets["30+"] += amt;
    }
    return buckets;
  }, [invoices]);

  async function setStatus(
    id: string,
    status: "draft" | "sent" | "partial" | "paid" | "overdue",
  ) {
    setBusyId(id);
    try {
      await setInvoiceStatusStub();
      // router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
      <div className="text-2xl font-semibold">Invoices</div>
      <div className="text-sm text-neutral-600">
        AR aging + Stripe links + status updates (logged).
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(aging).map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-neutral-50 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-700">
              {k} days
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {money(v)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="py-2">Invoice</th>
              <th className="py-2">Customer</th>
              <th className="py-2">Due</th>
              <th className="py-2">Status</th>
              <th className="py-2">Balance</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((x) => {
              const overdue = daysOverdue(x.dueDate);
              const balance =
                typeof x.balanceDue === "number" ? x.balanceDue : x.total;
              return (
                <tr key={x.id} className="border-t">
                  <td className="py-3">
                    {x.invoiceNumber || x.id.slice(0, 8)}
                  </td>
                  <td className="py-3">{x.customerName || "-"}</td>
                  <td className="py-3">
                    {x.dueDate
                      ? typeof x.dueDate === "object" && "toDate" in x.dueDate
                        ? x.dueDate.toDate().toLocaleDateString()
                        : x.dueDate.toLocaleDateString()
                      : "-"}
                    {x.status !== "paid" && overdue > 0 ? (
                      <div className="text-xs text-rose-600">
                        {overdue} days overdue
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3">{x.status || "-"}</td>
                  <td className="py-3">{money(balance)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {x.stripePaymentLink ? (
                        <a
                          href={x.stripePaymentLink}
                          target="_blank"
                          className="rounded-2xl border px-3 py-1.5 text-xs hover:bg-neutral-50"
                          rel="noreferrer"
                        >
                          Open Pay Link
                        </a>
                      ) : null}

                      <button
                        disabled={busyId === x.id}
                        onClick={() => setStatus(x.id, "sent")}
                        className="rounded-2xl border px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Mark Sent
                      </button>

                      <button
                        disabled={busyId === x.id}
                        onClick={() => setStatus(x.id, "paid")}
                        className="rounded-2xl bg-neutral-900 px-3 py-1.5 text-xs text-background hover:opacity-90 disabled:opacity-50"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
