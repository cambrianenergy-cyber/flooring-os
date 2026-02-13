"use client";
import { useState } from "react";
import {
    useFounderIdentity,
    useFounderWorkspaceSnapshots,
} from "../../hooks/founderDataHooks";
import ExportsPanel from "./components/ExportsPanel";
import FeatureFlagsPanel from "./components/FeatureFlagsPanel";
import ImpersonationPanel from "./components/ImpersonationPanel";
import SnapshotControlsPanel from "./components/SnapshotControlsPanel";
import TableSkeleton from "./components/TableSkeleton";
import WorkspaceRow from "./components/WorkspaceRow";
import { EmptyState } from "./EmptyState";

type FounderWorkspaceSnapshot = {
  id: string;
  name?: string;
  industry?: string;
  health?: string;
  plan?: string;
  billingStatus?: string;
  totalMRRCents?: number;
  wins30d?: number;
  updatedAt?: Date | { seconds: number } | string;
};

const FounderWorkspacesPage = () => {
  const [filters, setFilters] = useState({});

  // Get current user (founder) ID
  let uid: string | undefined = undefined;
  if (typeof window !== "undefined") {
    uid = window.localStorage.getItem("founderUserId") || undefined;
  }
  const identity = useFounderIdentity(uid);
  const founderId = identity?.founderId || "demo-founder";

  // Real data from Firestore
  const data = useFounderWorkspaceSnapshots(founderId, { filters });
  const loading = !identity || !data;

  if (loading) {
    return (
      <div className="p-4">
        <TableSkeleton rows={10} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* Admin/Founder Utility Panels */}
      <ImpersonationPanel />
      <SnapshotControlsPanel />
      <FeatureFlagsPanel founderId={founderId} />
      <ExportsPanel />

      {/* Main Table or Empty State */}
      {data.length === 0 ? (
        <div className="p-4 text-center">
          <EmptyState message="No workspaces found" />
          <button
            className="mt-2 btn btn-secondary"
            onClick={() => setFilters({})}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <section className="bg-white rounded shadow p-4">
          <table className="min-w-full bg-white border rounded">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Industry</th>
                <th className="px-4 py-2">Health</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Billing</th>
                <th className="px-4 py-2">MRR</th>
                <th className="px-4 py-2">Wins (30d)</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((ws: FounderWorkspaceSnapshot) => {
                let updatedAt: Date | null = null;
                if (ws.updatedAt) {
                  if (
                    typeof ws.updatedAt === "object" &&
                    "seconds" in ws.updatedAt
                  ) {
                    updatedAt = new Date(ws.updatedAt.seconds * 1000);
                  } else if (ws.updatedAt instanceof Date) {
                    updatedAt = ws.updatedAt;
                  } else if (typeof ws.updatedAt === "string") {
                    updatedAt = new Date(ws.updatedAt);
                  }
                }
                return (
                  <WorkspaceRow
                    key={ws.id}
                    workspace={{
                      name: ws.name ?? "",
                      industry: ws.industry ?? "",
                      health: ws.health ?? "",
                      plan: ws.plan ?? "",
                      billingStatus: ws.billingStatus ?? "",
                      mrr: ws.totalMRRCents
                        ? ws.totalMRRCents / 100
                        : undefined,
                      wins30d: ws.wins30d,
                      updatedAt,
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default FounderWorkspacesPage;
