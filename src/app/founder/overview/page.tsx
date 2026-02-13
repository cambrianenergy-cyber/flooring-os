"use client"
import SkeletonPage from "@/components/SkeletonPage";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
} from "firebase/firestore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// --- WorkspaceTable Component ---
// Firestore Timestamp type (partial)
type FirestoreTimestamp = { seconds: number; nanoseconds: number };

// WorkspaceSnapshot type matching the provided structure
type WorkspaceSnapshot = {
  id: string;
  name: string;
  industry: string;
  plan?: string;
  billingStatus?: "active" | "past_due" | "canceled" | "trialing" | "inactive";
  totalMRRCents?: number;
  totalRevenueCents?: number;
  totalUsers?: number | string;
  activeUsers?: number;
  activeReps?: number;
  estimates30d?: number;
  contracts30d?: number;
  wins30d?: number;
  signed30d?: number;
  estimatesCount?: number;
  contractsCount?: number;
  signedCount?: number;
  lastActivityAt?: FirestoreTimestamp | number | Date | string;
  health: "green" | "yellow" | "red";
  updatedAt: FirestoreTimestamp | number | Date | string;
  createdAt: FirestoreTimestamp | number | Date | string;
};

// For table compatibility, alias WorkspaceTableRow to WorkspaceSnapshot
type WorkspaceTableRow = WorkspaceSnapshot;

function WorkspaceTable({ workspaces }: { workspaces: WorkspaceTableRow[] }) {
  const router = useRouter();
  if (!workspaces?.length)
    return <div className="text-gray-400 text-xs">No workspaces found.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="text-left px-2 py-1">Name</th>
            <th className="text-left px-2 py-1">Industry</th>
            <th className="text-left px-2 py-1">Plan</th>
            <th className="text-left px-2 py-1">MRR</th>
            <th className="text-left px-2 py-1">Users</th>
            <th className="text-left px-2 py-1">30d Est/Con/Signed</th>
            <th className="text-left px-2 py-1">Health</th>
            <th className="text-left px-2 py-1">Last Activity</th>
            <th className="text-left px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workspaces.map((ws) => {
            // Health badge color
            let healthColor = "bg-gray-200 text-gray-700";
            if (ws.health === "green")
              healthColor = "bg-green-100 text-green-700";
            else if (ws.health === "yellow")
              healthColor = "bg-yellow-100 text-yellow-700";
            else if (ws.health === "red")
              healthColor = "bg-red-100 text-red-700";
            // 30d stats
            const est =
              typeof ws.estimates30d === "number"
                ? ws.estimates30d
                : typeof ws.estimatesCount === "number"
                  ? ws.estimatesCount
                  : "-";
            const con =
              typeof ws.contracts30d === "number"
                ? ws.contracts30d
                : typeof ws.contractsCount === "number"
                  ? ws.contractsCount
                  : "-";
            const sig =
              typeof ws.signed30d === "number"
                ? ws.signed30d
                : typeof ws.signedCount === "number"
                  ? ws.signedCount
                  : "-";
            // Last activity
            let lastActivity = "-";
            if (ws.updatedAt) {
              let d: Date | null = null;
              if (typeof ws.updatedAt === "number") {
                d = new Date(ws.updatedAt);
              } else if (
                typeof ws.updatedAt === "object" &&
                ws.updatedAt !== null &&
                "seconds" in ws.updatedAt &&
                typeof (ws.updatedAt as FirestoreTimestamp).seconds === "number"
              ) {
                d = new Date(
                  (ws.updatedAt as FirestoreTimestamp).seconds * 1000,
                );
              } else if (
                typeof ws.updatedAt === "string" ||
                ws.updatedAt instanceof Date
              ) {
                d = new Date(ws.updatedAt as string | Date);
              }
              if (d && !isNaN(d.getTime())) {
                lastActivity =
                  d.toLocaleDateString() + " " + d.toLocaleTimeString();
              }
            }
            return (
              <tr key={ws.id ?? ""}>
                <td className="px-2 py-1 font-semibold">
                  {typeof ws.name === "string" ? ws.name : String(ws.id)}
                </td>
                <td className="px-2 py-1">
                  {typeof ws.industry === "string" ? ws.industry : "-"}
                </td>
                <td className="px-2 py-1">
                  {typeof ws.plan === "string" ? ws.plan : "-"}
                </td>
                <td className="px-2 py-1">
                  {ws.totalMRRCents != null &&
                  typeof ws.totalMRRCents === "number"
                    ? `$${(ws.totalMRRCents / 100).toLocaleString()}`
                    : "-"}
                </td>
                <td className="px-2 py-1">
                  {typeof ws.totalUsers === "number" ||
                  typeof ws.totalUsers === "string"
                    ? ws.totalUsers
                    : "-"}
                </td>
                <td className="px-2 py-1">
                  {typeof est === "number" || typeof est === "string"
                    ? est
                    : "-"}{" "}
                  /{" "}
                  {typeof con === "number" || typeof con === "string"
                    ? con
                    : "-"}{" "}
                  /{" "}
                  {typeof sig === "number" || typeof sig === "string"
                    ? sig
                    : "-"}
                </td>
                <td className="px-2 py-1">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-bold ${healthColor}`}
                  >
                    {typeof ws.health === "string" ? ws.health : "-"}
                  </span>
                </td>
                <td className="px-2 py-1">{lastActivity}</td>
                <td className="px-2 py-1 flex gap-1">
                  <button
                    className="text-blue-600 underline"
                    onClick={() => router.push(`/founder/workspace/${ws.id}`)}
                  >
                    Open
                  </button>
                  <button
                    className="text-yellow-700 underline"
                    onClick={() =>
                      router.push(`/founder/workspace/${ws.id}/billing`)
                    }
                  >
                    Billing
                  </button>
                  <button
                    className="text-gray-700 underline"
                    onClick={() => router.push(`/impersonate/${ws.id}`)}
                  >
                    Impersonate
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type Workspace = { id: string; name: string };

type GlobalSnapshot = {
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalUsers: number;
  totalMRRCents?: number;
  totalRevenueCents?: number;
  estimates30d?: number;
  contracts30d?: number;
  wins30d?: number;
  agentRuns30d?: number;
  agentFailures30d?: number;
  pastDueCount?: number;
  docusignStuckCount?: number;
  webhookFailuresCount?: number;
  churnRatePct?: number;
  signedCount?: number;
  contractsCount?: number;
  estimatesCount?: number;
  createdAt: FirestoreTimestamp | number | Date | string;
};

function KpiCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-col items-start">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {subtext && <div className="text-xs text-red-500">{subtext}</div>}
    </div>
  );
}

export default function FounderOverviewPage() {
  const {
    ready,
    isFounderUser,
    founderUserId,
  }: {
    ready: boolean;
    isFounderUser: boolean;
    founderUserId?: string;
    workspaces?: Workspace[];
  } = useFounderAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function getInitialViewMode(): "founder" | "user" {
    if (typeof window !== "undefined") {
      const urlView = searchParams?.get("view");
      if (urlView === "founder" || urlView === "user") return urlView;
      const local = window.localStorage.getItem("squareos_viewMode");
      if (local === "founder" || local === "user") return local;
    }
    return "founder";
  }
  const [viewMode, setViewMode] = useState<"founder" | "user">(
    getInitialViewMode(),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("squareos_viewMode", viewMode);
      const params = new URLSearchParams(window.location.search);
      params.set("view", viewMode);
      const newUrl = `${pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [viewMode, pathname]);

  function handleToggle(newMode: "founder" | "user") {
    setViewMode(newMode);
    if (newMode === "founder") {
      router.push("/founder?view=founder");
    } else {
      router.push("/app?view=user");
    }
  }
  const [dateRange] = useState<"7d" | "30d" | "90d" | "YTD">("30d");
  const [selectedWorkspace] = useState<string>("all");
  const [globalSnapshot, setGlobalSnapshot] = useState<GlobalSnapshot | null>(
    null,
  );
  const [workspaceSnapshots, setWorkspaceSnapshots] = useState<
    WorkspaceSnapshot[]
  >([]);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageStack, setPageStack] = useState<
    QueryDocumentSnapshot<DocumentData>[]
  >([]); // for back navigation
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const pageSize = 25;

  // Pagination-aware fetch for workspace snapshots
  useEffect(() => {
    if (!ready || !isFounderUser || !founderUserId) return;

    async function fetchData() {
      setLoading(true);

      // Fetch global snapshot
      const globalSnapRef = collection(
        db,
        `founder/${founderUserId}/globalSnapshot`,
      );
      const globalSnap = await getDocs(
        query(globalSnapRef, orderBy("createdAt", "desc"), limit(1)),
      );
      setGlobalSnapshot(
        globalSnap.docs[0]
          ? (globalSnap.docs[0].data() as GlobalSnapshot)
          : null,
      );

      // Fetch workspace snapshots (paginated, 25 per page, order by updatedAt desc)
      const wsSnapRef = collection(
        db,
        `founder/${founderUserId}/workspaceSnapshots`,
      );
      let wsQuery;
      if (pageStack.length && lastDoc && currentPage > 1) {
        wsQuery = query(
          wsSnapRef,
          orderBy("updatedAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize),
        );
      } else {
        wsQuery = query(
          wsSnapRef,
          orderBy("updatedAt", "desc"),
          limit(pageSize),
        );
      }
      const wsSnap = await getDocs(wsQuery);
      setWorkspaceSnapshots(
        wsSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as WorkspaceSnapshot,
        ),
      );
      setLastDoc(wsSnap.docs[wsSnap.docs.length - 1] || null);
      setHasNextPage(wsSnap.docs.length === pageSize);

      // (Removed fetching and setting of billingIssues, docusignQueue, systemIssues, metricsDaily as their state is unused)

      setLoading(false);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    isFounderUser,
    founderUserId,
    dateRange,
    selectedWorkspace,
    currentPage,
  ]);

  if (!ready) return <SkeletonPage />;
  if (!isFounderUser) return <div>Access denied.</div>;
  if (loading) return <SkeletonPage />;

  // Example UI (replace with your actual UI)
  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${viewMode === "founder" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => handleToggle("founder")}
        >
          Founder View
        </button>
        <button
          className={`px-3 py-1 rounded ${viewMode === "user" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => handleToggle("user")}
        >
          User View
        </button>
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">KPIs</h2>
        <div className="flex gap-4">
          <KpiCard
            label="Total Workspaces"
            value={globalSnapshot?.totalWorkspaces ?? "-"}
          />
          <KpiCard
            label="Active Workspaces"
            value={globalSnapshot?.activeWorkspaces ?? "-"}
          />
          <KpiCard
            label="Total Users"
            value={globalSnapshot?.totalUsers ?? "-"}
          />
          <KpiCard
            label="Total MRR"
            value={
              globalSnapshot?.totalMRRCents
                ? `$${(globalSnapshot.totalMRRCents / 100).toLocaleString()}`
                : "-"
            }
          />
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Workspaces</h2>
        <WorkspaceTable workspaces={workspaceSnapshots} />
        {/* Pagination controls */}
        <div className="flex gap-2 mt-2">
          <button
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              setPageStack((stack) => stack.slice(0, -1));
            }}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={!hasNextPage}
            onClick={() => {
              setCurrentPage((p) => p + 1);
              setPageStack((stack) => [...stack, lastDoc!]);
            }}
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      {/* Add more sections for billingIssues, docusignQueue, systemIssues, metricsDaily as needed */}
    </div>
  );
}
