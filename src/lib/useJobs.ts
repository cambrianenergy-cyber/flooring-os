"use client";
// useJobs.ts
// React hook for real-time Firestore job data

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
import { debugOnSnapshot } from "./debugOnSnapshot";

type JobStatus =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "canceled"
  | "archived";

export interface Job {
  id: string;
  workspaceId: string;
  name?: string;
  status?: JobStatus;
  customerId?: string | null;
  scheduledDate?: any;
  // optional extras
  title?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}
export function useJobs(workspaceId: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    const unsub = debugOnSnapshot(
      collection(db, "jobs"),
      "JOBS_LISTENER",
      (snap: QuerySnapshot<DocumentData>) => {
        setJobs(
          snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Job))
            .filter(job => job.workspaceId === workspaceId)
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, [workspaceId]);

  return { jobs, loading, error };
}
