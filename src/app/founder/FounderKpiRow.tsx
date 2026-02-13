import { useFounderGlobalSnapshot } from "@/hooks/founderDataHooks";
import { useRouter } from "next/navigation";
import React from "react";

import { InlineSkeleton } from "./Skeletons";

function EmptyState({
  message,
  cta,
  showCta,
  onCta,
}: {
  message: string;
  cta: string;
  showCta: boolean;
  onCta: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="text-2xl font-bold mb-2 text-indigo-600">
        {message || "No Estimates Yet"}
      </div>
      <div className="mb-4 text-[#7985a8]">
        Estimates are the first step in your workflow. Create an estimate to get
        started on a new job.
      </div>
      {showCta && (
        <button
          className="bg-indigo-600 text-background px-6 py-2 rounded font-semibold hover:bg-indigo-700 transition"
          onClick={onCta}
        >
          {cta}
        </button>
      )}
    </div>
  );
}

function KpiCardSkeleton() {
  return <InlineSkeleton height={80} />;
}

function KpiCard({
  label,
  value,
  subtext,
  onClick,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="bg-white rounded shadow p-4 flex flex-col items-start cursor-pointer hover:bg-blue-50"
      onClick={onClick}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {subtext && <div className="text-xs text-red-500">{subtext}</div>}
    </div>
  );
}

export function FounderKpiRow({ founderId }: { founderId: string }) {
  const router = useRouter();
  const snapshot = useFounderGlobalSnapshot(founderId);

  const [rebuilding, setRebuilding] = React.useState(false);
  const [rebuildMsg, setRebuildMsg] = React.useState<string | null>(null);
  if (snapshot === null) return <KpiCardSkeleton />;
  if (!snapshot)
    return (
      <EmptyState
        message={rebuildMsg || "Snapshots building…"}
        cta={rebuilding ? "Rebuilding…" : "Rebuild now"}
        showCta={!rebuilding}
        onCta={async () => {
          setRebuilding(true);
          setRebuildMsg(null);
          try {
            const res = await fetch("/api/founder/rebuild-snapshots", {
              method: "POST",
            });
            const data = await res.json();
            if (data.ok) {
              setRebuildMsg("Rebuild requested! This may take a minute.");
            } else {
              setRebuildMsg(
                "Failed to request rebuild: " + (data.error || "Unknown error"),
              );
            }
          } catch (e) {
            const errorMsg =
              e instanceof Error
                ? e.message
                : typeof e === "string"
                  ? e
                  : "Unknown error";
            setRebuildMsg("Failed to request rebuild: " + errorMsg);
          } finally {
            setRebuilding(false);
          }
        }}
      />
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <KpiCard
        label="Total MRR"
        value={
          typeof snapshot.totalMRRCents === "number"
            ? `$${(snapshot.totalMRRCents / 100).toLocaleString()}`
            : "-"
        }
        onClick={() => router.push("/founder/revenue")}
      />
      <KpiCard
        label="Active Workspaces"
        value={
          typeof snapshot.activeWorkspaces === "number"
            ? snapshot.activeWorkspaces
            : "-"
        }
        onClick={() => router.push("/founder/workspaces?filter=active")}
      />
      <KpiCard
        label="Active Users"
        value={
          typeof snapshot.totalUsers === "number" ? snapshot.totalUsers : "-"
        }
        onClick={() => router.push("/founder/workspaces?sort=users_desc")}
      />
      <KpiCard
        label="Revenue (30d)"
        value={
          typeof snapshot.totalRevenueCents === "number"
            ? `$${(snapshot.totalRevenueCents / 100).toLocaleString()}`
            : "-"
        }
        onClick={() => router.push("/founder/revenue?range=30d")}
      />
      <KpiCard
        label="Close Rate (30d)"
        value={
          typeof snapshot.contracts30d === "number" &&
          typeof snapshot.wins30d === "number" &&
          snapshot.contracts30d > 0
            ? `${((snapshot.wins30d / snapshot.contracts30d) * 100).toFixed(1)}%`
            : "-"
        }
        onClick={() => router.push("/founder/sales")}
      />
      <KpiCard
        label="Agent Runs (30d)"
        value={
          typeof snapshot.agentRuns30d === "number"
            ? snapshot.agentRuns30d
            : "-"
        }
        subtext={
          typeof snapshot.agentFailures30d === "number"
            ? `${snapshot.agentFailures30d} failures`
            : undefined
        }
        onClick={() => router.push("/founder/agents")}
      />
    </div>
  );
}
