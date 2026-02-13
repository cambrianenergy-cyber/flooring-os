"use client";
// ...rest of your code..."use client";

import { moveJob } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type JobStatus = "scheduled" | "in_progress" | "blocked" | "completed";

export type Job = {
  id: string;
  title: string;
  status: JobStatus;
  blockedReason?: string;
  crewId?: string;
  startDate?: Date | { toDate: () => Date };
  address?: string;
  propertyAddress?: string;
  customerName?: string;
};

const COLS: { key: JobStatus; label: string }[] = [
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "completed", label: "Completed" },
];

export default function JobsKanban({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g: Record<JobStatus, Job[]> = {
      scheduled: [],
      in_progress: [],
      blocked: [],
      completed: [],
    };
    for (const j of jobs) {
      const s = (j.status || "scheduled") as JobStatus;
      if (!g[s]) g.scheduled.push(j);
      else g[s].push(j);
    }
    return g;
  }, [jobs]);

  async function quickMove(jobId: string, status: JobStatus) {
    let blockedReason: string | undefined;
    if (status === "blocked") {
      blockedReason =
        prompt("Blocked reason (materials, customer, crew, weather, etc):") ||
        "blocked";
    }
    setBusyId(jobId);
    try {
      await moveJob({ jobId, status, blockedReason });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
      <div className="text-2xl font-semibold">Jobs</div>
      <div className="text-sm text-neutral-600">
        Kanban + real status updates (logged).
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {COLS.map((c) => (
          <div key={c.key} className="rounded-3xl bg-neutral-50 p-4">
            <div className="font-semibold">{c.label}</div>
            <div className="mt-3 flex flex-col gap-3">
              {grouped[c.key].map((j) => (
                <div
                  key={j.id}
                  className="rounded-2xl bg-background text-slate-900 p-4 shadow-sm"
                >
                  <div className="font-medium">
                    {j.title || j.customerName || "Job"}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {j.address || j.propertyAddress || "-"}
                  </div>
                  {j.status === "blocked" ? (
                    <div className="mt-2 text-xs text-rose-600">
                      Blocked: {j.blockedReason || "blocked"}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {COLS.filter((x) => x.key !== c.key).map((dest) => (
                      <button
                        key={dest.key}
                        disabled={busyId === j.id}
                        onClick={() => quickMove(j.id, dest.key)}
                        className="rounded-2xl border px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50"
                      >
                        → {dest.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {grouped[c.key].length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
                  No jobs here.
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
