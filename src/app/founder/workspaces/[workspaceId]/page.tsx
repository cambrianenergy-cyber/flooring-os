"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import WorkspaceKpiRow from "../WorkspaceKpiRow";
import WorkspacePipelinePanel from "../WorkspacePipelinePanel";
import WorkspaceSnapshotPanel from "../WorkspaceSnapshotPanel";

// Placeholder components for new tabs
const PageSkeleton = () => (
  <div className="p-8 text-center text-gray-400 animate-pulse">
    Loading workspace...
  </div>
);
const NotFoundState = () => (
  <div className="p-8 text-center text-red-500">
    Workspace snapshot not found.
  </div>
);
// Mock data and related components moved outside
const mockBillingIssues = [
  {
    id: "b1",
    type: "Overdue Invoice",
    message: "Invoice #1234 is overdue.",
    date: "2026-01-10",
  },
];
const mockDocusignQueue = [
  {
    id: "d1",
    type: "Pending Signature",
    message: "Contract #5678 awaiting signature.",
    date: "2026-01-12",
  },
];
const mockSystemIssues = [
  {
    id: "s1",
    type: "Sync Error",
    message: "Failed to sync with external system.",
    date: "2026-01-15",
  },
];
const mockAuditLogs = Array.from({ length: 5 }, (_, i) => ({
  id: `a${i + 1}`,
  action: "User login",
  user: `user${i + 1}@example.com`,
  date: `2026-01-${10 + i}`,
}));

type Issue = {
  id: string;
  type: string;
  message: string;
  date: string;
};

const BillingIssuesList = ({ issues }: { issues: Issue[] }) => (
  <div className="bg-white rounded shadow p-4">
    <div className="font-semibold mb-2">Billing Issues</div>
    {issues.length === 0 ? (
      <div className="text-gray-400 text-sm">No billing issues</div>
    ) : (
      <ul className="text-sm">
        {issues.map((issue) => (
          <li key={issue.id} className="border-b last:border-b-0 py-1">
            <span className="font-medium">{issue.type}:</span> {issue.message}{" "}
            <span className="text-xs text-gray-400">({issue.date})</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const DocusignQueueList = ({ issues }: { issues: Issue[] }) => (
  <div className="bg-white rounded shadow p-4">
    <div className="font-semibold mb-2">Docusign Queue</div>
    {issues.length === 0 ? (
      <div className="text-gray-400 text-sm">No Docusign issues</div>
    ) : (
      <ul className="text-sm">
        {issues.map((issue) => (
          <li key={issue.id} className="border-b last:border-b-0 py-1">
            <span className="font-medium">{issue.type}:</span> {issue.message}{" "}
            <span className="text-xs text-gray-400">({issue.date})</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const SystemIssuesList = ({ issues }: { issues: Issue[] }) => (
  <div className="bg-white rounded shadow p-4">
    <div className="font-semibold mb-2">System Issues</div>
    {issues.length === 0 ? (
      <div className="text-gray-400 text-sm">No system issues</div>
    ) : (
      <ul className="text-sm">
        {issues.map((issue) => (
          <li key={issue.id} className="border-b last:border-b-0 py-1">
            <span className="font-medium">{issue.type}:</span> {issue.message}{" "}
            <span className="text-xs text-gray-400">({issue.date})</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const WorkspaceIssuesPanel = () => (
  <div className="space-y-4">
    <BillingIssuesList issues={mockBillingIssues} />
    <DocusignQueueList issues={mockDocusignQueue} />
    <SystemIssuesList issues={mockSystemIssues} />
  </div>
);


const AuditLogPreview = () => (
  <div className="bg-white rounded shadow p-4">
    <div className="font-semibold mb-2">Audit Log (last 50)</div>
    <ul className="text-sm">
      {mockAuditLogs.map((log) => (
        <li key={log.id} className="border-b last:border-b-0 py-1">
          <span className="font-medium">{log.action}</span> by {log.user}{" "}
          <span className="text-xs text-gray-400">({log.date})</span>
        </li>
      ))}
    </ul>
  </div>
);

const UpcomingAppointmentsList = ({
  appointments,
}: {
  appointments: Appointment[];
}) => (
  <div className="bg-white rounded shadow p-4">
    <div className="font-semibold mb-2">Upcoming Appointments</div>
    <ul className="text-sm max-h-48 overflow-y-auto">
      {appointments.length === 0 && (
        <li className="text-gray-400">No appointments</li>
      )}
      {appointments.map((app, i) => (
        <li key={app.id || i} className="border-b last:border-b-0 py-1">
          {(typeof app.name === "string" && app.name) ||
            (typeof app.id === "string" && app.id) ||
            "Appointment"} -{" "}
          {app.createdAt
            ? new Date(app.createdAt as number).toLocaleDateString()
            : "-"}
        </li>
      ))}
    </ul>
  </div>
);

const WorkspaceBillingPanel = ({ snapshot }: { snapshot: Snapshot }) => (
  <div className="bg-white rounded shadow p-4">
    <div className="font-semibold mb-2">Billing Details</div>
    <div>Plan: {snapshot.plan || "-"}</div>
    <div>Status: {snapshot.status || "-"}</div>
    {/* <BillingDetailsCard billing={billing} /> */}
    {/* <StripeCustomerLink url={snapshot.stripeCustomerUrl} /> */}
    <div className="mt-2 text-xs text-blue-600">Stripe link (if available)</div>
  </div>
);

type Snapshot = {
  id: string;
  workspaceName?: string;
  industry?: string;
  plan?: string;
  status?: string;
  mrrCents?: number;
  activeUsers?: number;
  health?: string;
  updatedAt?: { seconds: number } | number;
  [key: string]: unknown;
};

type Estimate = { id: string; [key: string]: unknown };
type Contract = { id: string; [key: string]: unknown };
type Appointment = { id: string; [key: string]: unknown };

import WorkspaceDetailHeader from "../WorkspaceDetailHeader";

export default function Page() {
  const { workspaceId } = useParams() as { workspaceId: string };
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "snapshot" | "pipeline" | "scheduling" | "billing" | "issues" | "audit"
  >("snapshot");

  // --- DRILLDOWN: single-workspace live reads allowed ---
  useEffect(() => {
    if (!workspaceId) return;
    async function fetchData() {
      setLoading(true);
      // Fetch workspace snapshot doc directly (from founder collection, server writes only)
      const founderUserId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("founderUserId") || "demo-founder"
          : "demo-founder";
      const snapRef = doc(
        db,
        `founder/${founderUserId}/workspaceSnapshots/${workspaceId}`,
      );
      const snapDoc = await getDoc(snapRef);
      setSnapshot(
        snapDoc.exists() ? { id: snapDoc.id, ...snapDoc.data() } : null,
      );

      // --- ALLOWED: live reads from this workspace's subcollections ---
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      // estimates
      const estQ = query(
        collection(db, `workspaces/${workspaceId}/estimates`),
        where("createdAt", ">=", thirtyDaysAgo),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      const estSnap = await getDocs(estQ);
      setEstimates(estSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      // contracts
      const conQ = query(
        collection(db, `workspaces/${workspaceId}/contracts`),
        where("createdAt", ">=", thirtyDaysAgo),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      const conSnap = await getDocs(conQ);
      setContracts(conSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      // appointments
      const appQ = query(
        collection(db, `workspaces/${workspaceId}/appointments`),
        where("createdAt", ">=", thirtyDaysAgo),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      const appSnap = await getDocs(appQ);
      setAppointments(
        appSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
      setLoading(false);
    }
    fetchData();
  }, [workspaceId]);

  if (loading) return <PageSkeleton />;
  if (!snapshot) return <NotFoundState />;

  return (
    <div>
      {/* Workspace Detail Header */}
      <WorkspaceDetailHeader workspace={snapshot} />
      {/* Workspace KPI Row */}
      <WorkspaceKpiRow snapshot={snapshot} />
      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${tab === "snapshot" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-500"}`}
          onClick={() => setTab("snapshot")}
        >
          Snapshot
        </button>
        <button
          className={`px-4 py-2 font-medium ${tab === "pipeline" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-500"}`}
          onClick={() => setTab("pipeline")}
        >
          Pipeline
        </button>
        <button
          className={`px-4 py-2 font-medium ${tab === "scheduling" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-500"}`}
          onClick={() => setTab("scheduling")}
        >
          Scheduling
        </button>
        <button
          className={`px-4 py-2 font-medium ${tab === "billing" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-500"}`}
          onClick={() => setTab("billing")}
        >
          Billing
        </button>
        <button
          className={`px-4 py-2 font-medium ${tab === "issues" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-500"}`}
          onClick={() => setTab("issues")}
        >
          Issues
        </button>
        <button
          className={`px-4 py-2 font-medium ${tab === "audit" ? "border-b-2 border-blue-600 text-blue-700" : "text-gray-500"}`}
          onClick={() => setTab("audit")}
        >
          Audit
        </button>
      </div>
      {tab === "snapshot" && <WorkspaceSnapshotPanel snapshot={snapshot} />}
      {tab === "pipeline" && (
        <WorkspacePipelinePanel estimates={estimates} contracts={contracts} />
      )}
      {tab === "scheduling" && (
        <UpcomingAppointmentsList appointments={appointments} />
      )}
      {tab === "billing" && <WorkspaceBillingPanel snapshot={snapshot} />}
      {tab === "issues" && <WorkspaceIssuesPanel />}
      {tab === "audit" && <AuditLogPreview />}
      {/* Team: members + roles */}
      <section className="mb-4">
        <h2 className="font-semibold">Team</h2>
        <div>Coming soon</div>
      </section>
      {/* Scheduling: appointments volume */}
      <section className="mb-4">
        <h2 className="font-semibold">Scheduling</h2>
        <div>Coming soon</div>
      </section>
      {/* Billing: plan/status */}
      <section className="mb-4">
        <h2 className="font-semibold">Billing</h2>
        <div>
          Plan: {snapshot.plan || "-"}, Status: {snapshot.status || "-"}
        </div>
      </section>
      {/* Audit: audit logs high-level */}
      <section className="mb-4">
        <h2 className="font-semibold">Audit</h2>
        <div>Coming soon</div>
      </section>
    </div>
  );
}
