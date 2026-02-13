"use client";

import { approveEstimate, rejectEstimate } from "@/lib/actions";
import {
    computeEstimateIntelligence,
    EstimateRoom,
} from "@/lib/estimate/intelligence";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export type Estimate = {
  id: string;
  estimateNumber?: string;
  customerName?: string;
  propertyAddress?: string;
  status?: string;
  total?: number;
  marginPct?: number;
};

function money(n?: number) {
  if (typeof n !== "number") return "-";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function EstimatesClient({
  founder,
  status,
  q,
  items,
}: {
  founder: boolean;
  status: string;
  q: string;
  items: Estimate[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [busyId, setBusyId] = useState<string | null>(null);

  const needsApproval = useMemo(
    () => items.filter((x) => x.status === "needs_approval"),
    [items],
  );

  function setParam(key: string, value: string) {
    if (!sp) return;
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/dashboard/estimates?${next.toString()}`);
  }

  async function doApprove(id: string) {
    const reason = prompt("Approval reason (required):");
    if (!reason?.trim()) return;
    setBusyId(id);
    try {
      await approveEstimate({ estimateId: id, reason: reason.trim() });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function doReject(id: string) {
    const reason = prompt("Rejection reason (required):");
    if (!reason?.trim()) return;
    setBusyId(id);
    try {
      await rejectEstimate({ estimateId: id, reason: reason.trim() });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-2xl font-semibold">Estimates</div>
          <div className="text-sm text-neutral-600">
            Filters + approvals (founder protects margin).
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-2xl border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="needs_approval">Needs Approval</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            className="w-72 rounded-2xl border px-3 py-2 text-sm"
            defaultValue={q}
            placeholder="Search customer, address, estimate #"
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setParam("q", (e.target as HTMLInputElement).value);
            }}
          />
        </div>
      </div>

      {founder && needsApproval.length > 0 ? (
        <div className="mt-6 rounded-3xl bg-amber-50 p-4">
          <div className="font-semibold text-amber-900">
            Needs Approval Queue
          </div>
          <div className="text-sm text-amber-900/80">
            These estimates violate a policy (discount/margin). Approve or
            reject with a reason.
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {needsApproval.map((x) => (
              <div
                key={x.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background text-slate-900 px-4 py-3"
              >
                <div>
                  <div className="font-medium">
                    {x.customerName || "Unknown Customer"}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {x.propertyAddress || "-"} • Total {money(x.total)} • Margin{" "}
                    {x.marginPct ?? "-"}%
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busyId === x.id}
                    onClick={() => doApprove(x.id)}
                    className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-background hover:opacity-90 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busyId === x.id}
                    onClick={() => doReject(x.id)}
                    className="rounded-2xl border px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="py-2">Estimate</th>
              <th className="py-2">Customer</th>
              <th className="py-2">Status</th>
              <th className="py-2">Total</th>
              <th className="py-2">Margin</th>
              <th className="py-2">Intelligence</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => {
              // Example: expects x.rooms, x.commissionPct
              let intelligence = null;
              if (
                Array.isArray((x as any).rooms) &&
                typeof (x as any).commissionPct === "number"
              ) {
                intelligence = computeEstimateIntelligence({
                  rooms: (x as any).rooms as EstimateRoom[],
                  commissionPct: (x as any).commissionPct,
                });
              }
              return (
                <tr key={x.id} className="border-t">
                  <td className="py-3">
                    {x.estimateNumber || x.id.slice(0, 8)}
                  </td>
                  <td className="py-3">{x.customerName || "-"}</td>
                  <td className="py-3">{x.status || "-"}</td>
                  <td className="py-3">{money(x.total)}</td>
                  <td className="py-3">
                    {typeof x.marginPct === "number" ? `${x.marginPct}%` : "-"}
                  </td>
                  <td className="py-3">
                    {intelligence ? (
                      <ul className="text-xs text-amber-700 list-disc ml-4">
                        {intelligence.flags.length > 0 ? (
                          intelligence.flags.map((f, i) => <li key={i}>{f}</li>)
                        ) : (
                          <li className="text-green-700">Healthy margin</li>
                        )}
                      </ul>
                    ) : (
                      <span className="text-neutral-400">N/A</span>
                    )}
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
