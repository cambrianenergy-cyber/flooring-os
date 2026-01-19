import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { withWorkspace, withUpdate } from "@/lib/withWorkspace";

export async function createJob(workspaceId: string, job: {
  customerId: string;
  name: string;
  notes?: string;
  scheduledDate?: Date | null;
}) {
  const jobId = doc(collection(db, "jobs")).id;
  const jobData = withWorkspace(workspaceId, {
    ...job,
    status: "estimate",
    scheduledDate: job.scheduledDate || null,
    completedDate: null,
    notes: job.notes || "",
  });
  await setDoc(doc(db, "jobs", jobId), jobData);
  return jobId;
}

export async function updateJob(jobId: string, data: Record<string, any>) {
  await setDoc(doc(db, "jobs", jobId), withUpdate(data), { merge: true });
}
