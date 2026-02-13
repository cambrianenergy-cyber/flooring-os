"use client";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PunchList from "../../production/PunchList";
import ReviewAutomation from "../../production/ReviewAutomation";
import DocumentPanel from "./components/DocumentPanel";

interface Job {
  id?: string;
  name?: string;
  stage?: string;
  source?: string;
  rep?: string;
  customer?: string;
  created?: number;
}

export default function JobDetailPage() {
  const params = useParams() ?? {};
  // params is Record<string, string | string[]>, so handle array case
  const idParam = params["id"] ?? "";
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      const docRef = doc(db, "jobs", id);
      const snap = await getDoc(docRef);
      const jobData = snap.data() as Job | undefined;
      if (jobData) {
        setJob({ id: snap.id, ...jobData });
      } else {
        setJob(null);
      }
      setLoading(false);
    };
    fetchJob();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Job: {job.name}</h1>
      <div className="mb-2 text-gray-600">Stage: {job.stage ?? ""}</div>
      <div className="mb-2 text-gray-600">Source: {job.source ?? ""}</div>
      <div className="mb-2 text-gray-600">Rep: {job.rep ?? ""}</div>
      <div className="mb-2 text-gray-600">
        Customer: {job.customer ?? job.name}
      </div>
      <div className="mb-2 text-gray-600">
        Created: {job.created ? new Date(job.created).toLocaleString() : ""}
      </div>
      <PunchList jobId={job.id ?? ""} />
      <ReviewAutomation jobId={job.id ?? ""} />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Appointments</h2>
          <div className="text-muted">(Coming soon)</div>
        </div>
        {job?.id && <DocumentPanel jobId={job.id} />}
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Photos</h2>
          <div className="text-muted">(Coming soon)</div>
        </div>
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Tasks</h2>
          <div className="text-muted">(Coming soon)</div>
        </div>
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Estimate</h2>
          <div className="text-muted">(Coming soon)</div>
        </div>
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Materials</h2>
          <div className="text-muted">(Coming soon)</div>
        </div>
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Schedule</h2>
          <div className="text-muted">(Coming soon)</div>
        </div>
      </div>
    </div>
  );
}
