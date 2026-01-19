"use client";


import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useJobs } from "@/lib/useJobs";
import { useUserRole } from "@/lib/useUserRole";
import { auth } from "@/lib/firebase";
import { isFounder } from "@/lib/auth-utils";
import { db } from "@/lib/firebase";
import { EmptyStateJobs } from "@/app/components/EmptyStates";
import { doc, updateDoc } from "firebase/firestore";

export default function JobsDashboard() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { jobs, loading } = useJobs(workspaceId);
  const router = useRouter();
  const { role } = useUserRole();
  const user = auth.currentUser;
  const email = user?.email || null;
  const isPrivileged = role === "owner" || role === "admin" || isFounder(email);

  return (
    <div className="p-8 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
        <button
          className="bg-accent text-background px-4 py-2 rounded font-semibold"
          // onClick removed: setShowAdd no longer exists
        >
          + Add Job
        </button>
      </div>
      {loading ? (
        <div className="text-muted">Loading jobs5</div>
      ) : jobs.length === 0 ? (
        <EmptyStateJobs />
      ) : (
        <table className="w-full border rounded shadow bg-dark-muted">
          <thead>
            <tr className="bg-dark-panel text-left text-foreground">
              <th className="p-2">Name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Scheduled</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id} className="border-t hover:bg-dark-muted cursor-pointer" onClick={() => router.push(`/app/${workspaceId}/jobs/${job.id}`)}>
                <td className="p-2 font-semibold">{job.name ?? "—"}</td>
                <td className="p-2">{job.status ?? "—"}</td>
                <td className="p-2">{job.customerId ?? "—"}</td>
                <td className="p-2">{job.scheduledDate ? (typeof job.scheduledDate === "string" ? new Date(job.scheduledDate).toLocaleString() : new Date(job.scheduledDate.seconds * 1000).toLocaleDateString()) : "—"}</td>
                <td className="p-2 flex gap-2">
                  <button className="text-accent underline" onClick={e => { e.stopPropagation(); router.push(`/app/${workspaceId}/jobs/${job.id}`); }}>View</button>
                  {isPrivileged && (job.status === undefined || job.status !== "archived") && (
                    <button
                      className="text-muted underline"
                      onClick={async e => {
                        e.stopPropagation();
                        if (!window.confirm(`Archive job '${job.name ?? job.id}'? This will hide it from active lists but keep it for audit.`)) return;
                        await updateDoc(doc(db, "jobs", job.id), { status: "archived" });
                      }}
                    >
                      Archive
                    </button>
                  )}
                  {isPrivileged && job.status === "archived" && (
                    <span className="text-muted ml-2">(Archived)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* AddJobModal would go here */}
    </div>
  );
}
