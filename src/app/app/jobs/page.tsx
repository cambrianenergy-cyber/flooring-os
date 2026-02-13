"use client";
import { db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import Link from "next/link";

const STAGES = ["New", "Scheduled", "In Progress", "Completed", "Closed"];

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    customer: "",
    rep: "",
    stage: STAGES[0],
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const ws =
      typeof window === "undefined"
        ? ""
        : localStorage.getItem("workspaceId") || "";
    setWorkspaceId(ws);
  }, []);
  useEffect(() => {
    getDocs(collection(db, "jobs")).then((snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!workspaceId) {
      setCreateError("Set workspaceId in localStorage to create jobs.");
      return;
    }
    if (!form.name.trim()) {
      setCreateError("Job name is required.");
      return;
    }
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, "jobs"), {
        name: form.name,
        customer: form.customer || "",
        rep: form.rep || "",
        stage: form.stage,
        workspaceId,
        created: new Date().toISOString(),
      });
      setJobs((prev) => [
        {
          id: docRef.id,
          ...form,
          customer: form.customer || "",
          rep: form.rep || "",
          workspaceId,
        },
        ...prev,
      ]);
      setForm({ name: "", customer: "", rep: "", stage: STAGES[0] });
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create job.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteJob(id: string) {
    setCreateError(null);
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "jobs", id));
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err: any) {
      setCreateError(err?.message || "Failed to delete job.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <h1 className="text-2xl font-bold mb-4 text-slate-900">Jobs</h1>
      <form
        onSubmit={handleCreateJob}
        className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-white border border-slate-300 rounded-xl p-4 shadow-sm"
      >
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-900">
            Name
          </label>
          <input
            className="border border-slate-300 rounded px-2 py-1 w-full text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Job name"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-900">
            Customer
          </label>
          <input
            className="border border-slate-300 rounded px-2 py-1 w-full text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={form.customer}
            onChange={(e) =>
              setForm((f) => ({ ...f, customer: e.target.value }))
            }
            placeholder="Customer"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-900">
            Rep
          </label>
          <input
            className="border border-slate-300 rounded px-2 py-1 w-full text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={form.rep}
            onChange={(e) => setForm((f) => ({ ...f, rep: e.target.value }))}
            placeholder="Sales rep"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-900">
            Stage
          </label>
          <select
            className="border border-slate-300 rounded px-2 py-1 w-full text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={form.stage}
            onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded w-full font-semibold transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={creating}
          >
            {creating ? "Creating…" : "Create Job"}
          </button>
        </div>
        {createError && (
          <div className="text-sm text-red-600 md:col-span-5">
            {createError}
          </div>
        )}
        {!workspaceId && (
          <div className="text-xs text-amber-700 md:col-span-5">
            Set localStorage.workspaceId to scope jobs.
          </div>
        )}
      </form>
      <div className="flex gap-6 overflow-x-auto">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="min-w-[240px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          >
            <h2 className="font-semibold mb-2 text-slate-900">{stage}</h2>
            <ul>
              {jobs
                .filter((j) => j.stage === stage)
                .map((job) => (
                  <li
                    key={job.id}
                    className="mb-2 border-b border-slate-100 pb-2 flex items-start justify-between gap-2"
                  >
                    <div>
                      <Link
                        href={`/app/jobs/${job.id}`}
                        className="text-blue-700 underline hover:text-blue-900 font-medium"
                      >
                        {job.name}
                      </Link>
                      <div className="text-xs text-slate-600">
                        Rep: {job.rep}
                      </div>
                    </div>
                    <button
                      className="text-red-600 text-xs hover:underline"
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={deletingId === job.id}
                    >
                      {deletingId === job.id ? "Deleting…" : "Delete"}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
