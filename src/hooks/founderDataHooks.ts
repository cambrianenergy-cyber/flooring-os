"use client";
import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

// 1. useFounderIdentity
export function useFounderIdentity(uid?: string) {
  const [identity, setIdentity] = useState<{
    isFounder: boolean;
    founderId: string | null;
  } | null>(null);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, `users/${uid}`)).then((snap) => {
      const data = snap.data();
      setIdentity({ isFounder: !!data?.isFounder, founderId: uid });
    });
  }, [uid]);
  return identity;
}

// 2. useFounderGlobalSnapshot
type FounderGlobalSnapshot = Record<string, unknown> | null;
export function useFounderGlobalSnapshot(founderId: string) {
  const [snapshot, setSnapshot] = useState<FounderGlobalSnapshot>(null);
  useEffect(() => {
    if (!founderId) return;
    getDocs(
      query(
        collection(db, `founder/${founderId}/globalSnapshot`),
        orderBy("createdAt", "desc"),
        limit(1),
      ),
    ).then((snap) => {
      setSnapshot(snap.docs[0]?.data() ?? null);
    });
  }, [founderId]);
  return snapshot;
}

// 3. useFounderMetricsDaily
type FounderMetric = { id: string } & Record<string, unknown>;
export function useFounderMetricsDaily(founderId: string, dateRange: number) {
  const [metrics, setMetrics] = useState<FounderMetric[]>([]);
  useEffect(() => {
    if (!founderId) return;
    getDocs(
      query(
        collection(db, `founder/${founderId}/metricsDaily`),
        orderBy("date", "desc"),
        limit(dateRange),
      ),
    ).then((snap) => {
      setMetrics(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [founderId, dateRange]);
  return metrics;
}

// 4. useFounderWorkspaceSnapshots
type FounderWorkspaceSnapshot = { id: string } & Record<string, unknown>;
interface FounderWorkspaceSnapshotsOptions {
  filters?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
}
export function useFounderWorkspaceSnapshots(
  founderId: string,
  {
    filters = {},
    page = 1,
    pageSize = 25,
  }: FounderWorkspaceSnapshotsOptions = {},
) {
  const [snapshots, setSnapshots] = useState<FounderWorkspaceSnapshot[]>([]);
  useEffect(() => {
    if (!founderId) return;
    const q = query(
      collection(db, `founder/${founderId}/workspaceSnapshots`),
      orderBy("updatedAt", "desc"),
      limit(pageSize),
    );
    // Add filters if needed
    // TODO: implement filters
    getDocs(q).then((snap) => {
      setSnapshots(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [founderId, filters, page, pageSize]);
  return snapshots;
}

// 5. useFounderBillingIssues
type FounderBillingIssue = { id: string } & Record<string, unknown>;
interface FounderBillingIssuesOptions {
  limitNum?: number;
  workspaceId?: string;
}
export function useFounderBillingIssues(
  founderId: string,
  { limitNum = 10, workspaceId }: FounderBillingIssuesOptions = {},
) {
  const [issues, setIssues] = useState<FounderBillingIssue[]>([]);
  useEffect(() => {
    if (!founderId) return;
    let q = query(
      collection(db, `founder/${founderId}/billingIssues`),
      orderBy("createdAt", "desc"),
      limit(limitNum),
    );
    if (workspaceId) q = query(q, where("workspaceId", "==", workspaceId));
    getDocs(q).then((snap) => {
      setIssues(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [founderId, limitNum, workspaceId]);
  return issues;
}

// 6. useFounderDocusignQueue
type FounderDocusignQueueItem = { id: string } & Record<string, unknown>;
interface FounderDocusignQueueOptions {
  limitNum?: number;
  workspaceId?: string;
}
export function useFounderDocusignQueue(
  founderId: string,
  { limitNum = 10, workspaceId }: FounderDocusignQueueOptions = {},
) {
  const [queue, setQueue] = useState<FounderDocusignQueueItem[]>([]);
  useEffect(() => {
    if (!founderId) return;
    let q = query(
      collection(db, `founder/${founderId}/docusignQueue`),
      orderBy("createdAt", "desc"),
      limit(limitNum),
    );
    if (workspaceId) q = query(q, where("workspaceId", "==", workspaceId));
    getDocs(q).then((snap) => {
      setQueue(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [founderId, limitNum, workspaceId]);
  return queue;
}

// 7. useFounderSystemIssues
type FounderSystemIssue = { id: string } & Record<string, unknown>;
interface FounderSystemIssuesOptions {
  limitNum?: number;
  status?: string;
  workspaceId?: string;
}
export function useFounderSystemIssues(
  founderId: string,
  { limitNum = 10, status, workspaceId }: FounderSystemIssuesOptions = {},
) {
  const [issues, setIssues] = useState<FounderSystemIssue[]>([]);
  useEffect(() => {
    if (!founderId) return;
    let q = query(
      collection(db, `founder/${founderId}/systemIssues`),
      orderBy("createdAt", "desc"),
      limit(limitNum),
    );
    if (workspaceId) q = query(q, where("workspaceId", "==", workspaceId));
    if (status) q = query(q, where("status", "==", status));
    getDocs(q).then((snap) => {
      setIssues(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [founderId, limitNum, status, workspaceId]);
  return issues;
}

// 8. useWorkspaceSnapshot
type WorkspaceSnapshot = Record<string, unknown> | null;
export function useWorkspaceSnapshot(founderId: string, workspaceId: string) {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(null);
  useEffect(() => {
    if (!founderId || !workspaceId) return;
    getDoc(
      doc(db, `founder/${founderId}/workspaceSnapshots/${workspaceId}`),
    ).then((snap) => {
      setSnapshot(snap.data() ?? null);
    });
  }, [founderId, workspaceId]);
  return snapshot;
}

// 9. useWorkspaceRecentEstimates
type WorkspaceEstimate = { id: string } & Record<string, unknown>;
export function useWorkspaceRecentEstimates(
  workspaceId: string,
  limitNum = 10,
) {
  const [estimates, setEstimates] = useState<WorkspaceEstimate[]>([]);
  useEffect(() => {
    if (!workspaceId) return;
    getDocs(
      query(
        collection(db, `workspaces/${workspaceId}/estimates`),
        orderBy("createdAt", "desc"),
        limit(limitNum),
      ),
    ).then((snap) => {
      setEstimates(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [workspaceId, limitNum]);
  return estimates;
}

// 10. useWorkspaceRecentContracts
type WorkspaceContract = { id: string } & Record<string, unknown>;
export function useWorkspaceRecentContracts(
  workspaceId: string,
  limitNum = 10,
) {
  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);
  useEffect(() => {
    if (!workspaceId) return;
    getDocs(
      query(
        collection(db, `workspaces/${workspaceId}/contracts`),
        orderBy("createdAt", "desc"),
        limit(limitNum),
      ),
    ).then((snap) => {
      setContracts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [workspaceId, limitNum]);
  return contracts;
}

// 11. useWorkspaceUpcomingAppointments
type WorkspaceAppointment = { id: string } & Record<string, unknown>;
export function useWorkspaceUpcomingAppointments(
  workspaceId: string,
  limitNum = 10,
) {
  const [appointments, setAppointments] = useState<WorkspaceAppointment[]>([]);
  useEffect(() => {
    if (!workspaceId) return;
    getDocs(
      query(
        collection(db, `workspaces/${workspaceId}/appointments`),
        orderBy("date", "asc"),
        limit(limitNum),
      ),
    ).then((snap) => {
      setAppointments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [workspaceId, limitNum]);
  return appointments;
}
