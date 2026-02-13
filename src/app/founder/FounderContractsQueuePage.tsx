import { useState } from "react";
import {
  useFounderDocusignQueue,
  useFounderIdentity,
} from "../../hooks/founderDataHooks";
import ContractDetailDrawer from "./components/ContractDetailDrawer";
import TableSkeleton from "./components/TableSkeleton";
import { EmptyState } from "./EmptyState";

const statusOptions = [
  { label: "Sent", value: "sent" },
  { label: "Delivered", value: "delivered" },
  { label: "Signed", value: "signed" },
  { label: "Error", value: "error" },
];

const stuckDaysOptions = [
  { label: ">= 3 days", value: 3 },
  { label: ">= 7 days", value: 7 },
  { label: ">= 14 days", value: 14 },
];

type QueueItem = {
  id: string;
  contractId?: string;
  workspaceName?: string;
  workspaceId?: string;
  customerName?: string;
  salesRep?: string;
  status: string;
  sentAt?: { seconds: number } | Date | string | null;
  stuckDays: number;
  signedAt?: { seconds: number } | Date | string | null;
  // industry?: string; // Uncomment if you want to use industry filter in the future
};

const FounderContractsQueuePage = () => {
  let uid: string | undefined = undefined;
  if (typeof window !== "undefined") {
    uid = window.localStorage.getItem("founderUserId") || undefined;
  }
  const identity = useFounderIdentity(uid);
  const founderId = identity?.founderId || "demo-founder";

  const [statusFilter, setStatusFilter] = useState<string[]>([
    "sent",
    "delivered",
    "signed",
    "error",
  ]);
  const [stuckDays, setStuckDays] = useState(3);
  // const [industry, setIndustry] = useState(""); // Remove unused industry state
  const [selected, setSelected] = useState<QueueItem | null>(null);

  const queue = useFounderDocusignQueue(founderId, { limitNum: 50 }) as
    | QueueItem[]
    | undefined;
  const loading = !identity || !queue;

  // Filter logic
  const filtered: QueueItem[] = Array.isArray(queue)
    ? queue.filter(
        (row) =>
          statusFilter.includes(row.status) &&
          // (!industry || row.industry === industry) && // Remove unused industry filter
          row.stuckDays >= stuckDays,
      )
    : [];

  // Summary
  const stuck7 = filtered.filter((r) => r.stuckDays >= 7).length;
  const errors = filtered.filter((r) => r.status === "error").length;
  const signedToday = filtered.filter(
    (r) => r.status === "signed" && isToday(r.signedAt),
  ).length;

  if (loading)
    return (
      <div className="p-4">
        <TableSkeleton rows={8} />
      </div>
    );
  if (!filtered.length) return <EmptyState message="No contracts in queue." />;

  return (
    <section className="bg-white rounded shadow p-4">
      <ContractsQueueHeader />
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
        <StuckDaysSlider value={stuckDays} onChange={setStuckDays} />
        {/* <IndustryFilter value={industry} onChange={setIndustry} /> */}
      </div>
      <ContractsQueueSummaryCards
        stuck7={stuck7}
        errors={errors}
        signedToday={signedToday}
      />
      <ContractsQueueTable queue={filtered} onSelect={setSelected} />
      <ContractDetailDrawer
        contract={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
};

function isToday(
  date: { seconds?: number } | Date | string | null | undefined,
): boolean {
  if (!date) return false;
  let d: Date;
  if (
    typeof date === "object" &&
    date !== null &&
    "seconds" in date &&
    typeof date.seconds === "number"
  ) {
    d = new Date(date.seconds * 1000);
  } else if (typeof date === "string") {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return false;
  }
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const ContractsQueueHeader = () => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
    <h1 className="text-2xl font-bold">Contracts Queue</h1>
    <div className="text-gray-500 mt-2 md:mt-0">
      Monitor and resolve DocuSign contracts
    </div>
  </div>
);

const StatusFilterChips = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) => (
  <div className="flex gap-2 flex-wrap">
    {statusOptions.map((s) => (
      <button
        key={s.value}
        className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
          value.includes(s.value)
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
        }`}
        onClick={() =>
          value.includes(s.value)
            ? onChange(value.filter((v) => v !== s.value))
            : onChange([...value, s.value])
        }
        type="button"
      >
        {s.label}
      </button>
    ))}
  </div>
);

const StuckDaysSlider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-500">Stuck &gt;=</span>
    <select
      className="border rounded px-2 py-1 text-xs"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {stuckDaysOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <span className="text-xs text-gray-500">days</span>
  </div>
);

const ContractsQueueSummaryCards = ({
  stuck7,
  errors,
  signedToday,
}: {
  stuck7: number;
  errors: number;
  signedToday: number;
}) => (
  <div className="grid grid-cols-3 gap-4 mb-4">
    <SummaryCard label=">7d Stuck" value={stuck7} color="bg-yellow-50" />
    <SummaryCard label="Errors" value={errors} color="bg-red-50" />
    <SummaryCard label="Signed Today" value={signedToday} color="bg-green-50" />
  </div>
);

import SummaryCard from "./components/SummaryCard";

const ContractsQueueTable = ({
  queue,
  onSelect,
}: {
  queue: QueueItem[];
  onSelect: (row: QueueItem) => void;
}) => (
  <table className="min-w-full bg-white border rounded">
    <thead>
      <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
        <th className="px-4 py-2">Contract</th>
        <th className="px-4 py-2">Workspace</th>
        <th className="px-4 py-2">Customer</th>
        <th className="px-4 py-2">Sales Rep</th>
        <th className="px-4 py-2">Status</th>
        <th className="px-4 py-2">Sent At</th>
        <th className="px-4 py-2">Stuck Days</th>
        <th className="px-4 py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {queue.map((row) => (
        <tr key={row.id} className="border-b hover:bg-gray-50">
          <td className="px-4 py-2 font-mono text-xs">
            {row.contractId?.slice(-6) || row.id?.slice(-6)}
          </td>
          <td className="px-4 py-2">{row.workspaceName || row.workspaceId}</td>
          <td className="px-4 py-2">{row.customerName || "-"}</td>
          <td className="px-4 py-2">{row.salesRep || "-"}</td>
          <td className="px-4 py-2">{row.status}</td>
          <td className="px-4 py-2">
            {row.sentAt &&
            typeof row.sentAt === "object" &&
            "seconds" in row.sentAt
              ? new Date(
                  (row.sentAt as { seconds: number }).seconds * 1000,
                ).toLocaleDateString()
              : row.sentAt
                ? new Date(row.sentAt as string).toLocaleDateString()
                : "-"}
          </td>
          <td className="px-4 py-2">{row.stuckDays}</td>
          <td className="px-4 py-2">
            <button
              className="btn btn-xs btn-primary mr-1"
              onClick={() => onSelect(row)}
            >
              Open workspace
            </button>
            <button className="btn btn-xs btn-secondary mr-1">
              Open contract
            </button>
            <button className="btn btn-xs btn-accent">Mark resolved</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default FounderContractsQueuePage;
