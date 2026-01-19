"use client";
import React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserRole } from "@/lib/useUserRole";
import { auth } from "@/lib/firebase";
import { isFounder } from "@/lib/auth-utils";
import { useParams } from "next/navigation";
import { useJobDetails } from "@/lib/useJobDetails";

export default function JobDetailsPage() {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) ?? "";
  const jobId = (params?.jobId as string) ?? "";
  const { job, rooms, materials, labor, loading } = useJobDetails(jobId);
  const { role, loading: roleLoading } = useUserRole();
  const user = auth.currentUser;
  const email = user?.email || null;
  const isPrivileged = role === "owner" || role === "admin" || isFounder(email);

  if (loading || roleLoading) return <div className="p-8 text-muted">Loading job details…</div>;
  if (!job) return <div className="p-8 text-danger">Job not found.</div>;

  return (
    <div className="p-8 text-foreground">
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold text-foreground">{job.name}</h1>
        {isPrivileged && job.status !== "archived" && (
          <button
            className="text-muted underline"
            onClick={async () => {
              if (!window.confirm(`Archive job '${job.name ?? job.id}'? This will hide it from active lists but keep it for audit.`)) return;
              await updateDoc(doc(db, "jobs", job.id), { status: "archived" });
              window.location.reload();
            }}
          >
            Archive
          </button>
        )}
        {isPrivileged && job.status === "archived" && (
          <span className="text-muted">(Archived)</span>
        )}
      </div>
      <div className="mb-4 text-muted">Status: <span className="font-semibold text-foreground">{job.status}</span></div>
      <div className="mb-4 text-foreground">Customer: {job.customerId || "—"}</div>
      <div className="mb-4 text-foreground">Scheduled: {job.scheduledDate ? new Date(job.scheduledDate.seconds * 1000).toLocaleDateString() : "—"}</div>
      <div className="mb-8 text-foreground">Description: {job.description || "—"}</div>

      <h2 className="text-xl font-semibold mt-8 mb-2 text-foreground">Rooms</h2>
      {rooms.length === 0 ? <div className="text-muted">No rooms.</div> : (
        <ul className="mb-6">
          {rooms.map(room => (
              <li key={room.id} className="border-b border-dark-muted py-2 text-foreground">{room.name}</li>
          ))}
        </ul>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-2 text-foreground">Materials</h2>
      {materials.length === 0 ? <div className="text-muted">No materials.</div> : (
        <ul className="mb-6">
          {materials.map(mat => (
              <li key={mat.id} className="border-b border-dark-muted py-2 text-foreground">{mat.name} ({mat.quantity})</li>
          ))}
        </ul>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-2 text-foreground">Labor</h2>
      {labor.length === 0 ? <div className="text-muted">No labor entries.</div> : (
        <ul>
          {labor.map(l => (
              <li key={l.id} className="border-b border-dark-muted py-2 text-foreground">{l.role}: {l.hours} hours</li>
          ))}
        </ul>
      )}
    </div>
  );
}
