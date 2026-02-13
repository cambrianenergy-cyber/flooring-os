import { useState } from "react";
import {
  useFounderBillingIssues,
  useFounderIdentity,
} from "../../hooks/founderDataHooks";
import BillingOverviewHeader from "./components/BillingOverviewHeader";
import BillingSummaryCards from "./components/BillingSummaryCards";
import DateRangePicker from "./components/DateRangePicker";
import StatusFilterChips from "./components/StatusFilterChips";
import TableSkeleton from "./components/TableSkeleton";
import { EmptyState } from "./EmptyState";

type BillingIssue = {
  id: string;
  workspaceName?: string;
  workspaceId?: string;
  status: string;
  planId?: string;
  amountDueCents?: number;
  lastInvoiceAt?: { seconds: number };
  updatedAt?: { seconds: number };
};

const FounderBillingPage = () => {
  // Get current user (founder) ID
  // For demo, fallback to localStorage or a hardcoded value
  let uid: string | undefined = undefined;
  if (typeof window !== "undefined") {
    uid = window.localStorage.getItem("founderUserId") || undefined;
  }
  const identity = useFounderIdentity(uid);
  const founderId = identity?.founderId || "demo-founder";

  const [statusFilter, setStatusFilter] = useState<string[]>([
    "past_due",
    "canceled",
    "active",
    "trialing",
  ]);
  const [dateRange, setDateRange] = useState({
    start: "2026-01-01",
    end: "2026-01-15",
  });
  const [selected, setSelected] = useState<BillingIssue | null>(null);

  // Real data from Firestore
  const issues = useFounderBillingIssues(founderId, { limitNum: 50 }) as
    | BillingIssue[]
    | undefined;
  const loading = !identity || !issues;
  // Optionally, add error handling if needed

  // Filter by status
  const filtered: BillingIssue[] = Array.isArray(issues)
    ? issues.filter(
        (row): row is BillingIssue =>
          typeof row.status === "string" && statusFilter.includes(row.status),
      )
    : [];

  // Summary
  const pastDue = filtered.filter((r) => r.status === "past_due").length;
  const canceled = filtered.filter((r) => r.status === "canceled").length;
  const active = filtered.filter((r) => r.status === "active").length;
  const totalMRR = filtered.reduce(
    (sum, r) =>
      sum + (typeof r.amountDueCents === "number" ? r.amountDueCents : 0),
    0,
  );

  if (loading)
    return (
      <div className="p-4">
        <TableSkeleton rows={6} />
      </div>
    );
  if (!filtered.length)
    return <EmptyState message="No billing issues — you’re clean." />;

  return (
    <section className="bg-white rounded shadow p-4">
      <BillingOverviewHeader />
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <DateRangePicker
          start={dateRange.start}
          end={dateRange.end}
          onChange={setDateRange}
        />
        <div className="flex-1" />
        <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
      </div>
      <BillingSummaryCards
        pastDue={pastDue}
        canceled={canceled}
        active={active}
        totalMRR={totalMRR}
      />
      {/* BillingTrendPanel can be wired up to metricsDaily if available */}
      {/* <BillingTrendPanel data={mockTrend} /> */}
      <BillingIssuesTable issues={filtered} onSelect={setSelected} />
      {selected && (
        <div className="mt-4">Billing Issue Detail Drawer (coming soon)</div>
      )}
    </section>
  );
};

const BillingIssuesTable = ({
  issues,
  onSelect,
}: {
  issues: BillingIssue[];
  onSelect: (row: BillingIssue) => void;
}) => {
  if (!issues.length)
    return <EmptyState message="No billing issues — you’re clean." />;
  return (
    <table className="min-w-full bg-white border rounded">
      <thead>
        <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
          <th className="px-4 py-2 text-left">Workspace</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2 text-left">Plan</th>
          <th className="px-4 py-2 text-left">Amount Due</th>
          <th className="px-4 py-2 text-left">Last Invoice</th>
          <th className="px-4 py-2 text-left">Updated</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {issues.map((row) => (
          <tr key={row.id} className="border-b hover:bg-gray-50">
            <td className="px-4 py-2 font-medium">
              {row.workspaceName || row.workspaceId}
            </td>
            <td className="px-4 py-2">{row.status}</td>
            <td className="px-4 py-2">{row.planId}</td>
            <td className="px-4 py-2">
              {row.amountDueCents
                ? `$${(row.amountDueCents / 100).toLocaleString()}`
                : "-"}
            </td>
            <td className="px-4 py-2">
              {row.lastInvoiceAt
                ? new Date(
                    row.lastInvoiceAt.seconds * 1000,
                  ).toLocaleDateString()
                : "-"}
            </td>
            <td className="px-4 py-2">
              {row.updatedAt
                ? new Date(row.updatedAt.seconds * 1000).toLocaleDateString()
                : "-"}
            </td>
            <td className="px-4 py-2">
              <button
                className="btn btn-xs btn-primary mr-1"
                onClick={() => onSelect(row)}
              >
                Open workspace
              </button>
              <button className="btn btn-xs btn-secondary mr-1">Resolve</button>
              <button className="btn btn-xs btn-accent">Contact</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FounderBillingPage;
