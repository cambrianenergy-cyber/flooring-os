import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { getSessionUser } from "./sessionUser";

export type Job = {
  id: string;
  title: string;
  status: string;
  blockedReason?: string;
  crewId?: string;
  startDate?: Date | { toDate: () => Date };
  // Add additional known fields here as needed
  // unknown fields are not recommended, but if required:
  // [key: string]: unknown;
};

export async function fetchJobs(workspaceId: string): Promise<Job[]> {
  const q = query(
    collection(db, "jobs"),
    where("workspaceId", "==", workspaceId),
    orderBy("startDate", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Job);
}

export async function moveJobStatus(
  jobId: string,
  workspaceId: string,
  newStatus: string,
  blockedReason?: string,
) {
  const user = await getSessionUser();
  await updateDoc(doc(db, "jobs", jobId), {
    status: newStatus,
    blockedReason: newStatus === "blocked" ? blockedReason : null,
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(db, "workspaces", workspaceId, "audit_logs"), {
    actorUid: user?.uid ?? null,
    action: "move_job_status",
    entityType: "job",
    entityId: jobId,
    reason: blockedReason || null,
    createdAt: serverTimestamp(),
    before: null,
    after: { status: newStatus, blockedReason: blockedReason || null },
  });
}
