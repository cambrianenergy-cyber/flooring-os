import { db } from "@/lib/firebase/client";
import {
    collection,
    limit,
    orderBy,
    query,
    Timestamp,
    where,
} from "firebase/firestore";

export const qEstimatesByStatus = (workspaceId: string, status: string) =>
  query(
    collection(db, "estimates"),
    where("workspaceId", "==", workspaceId),
    where("status", "==", status),
    orderBy("updatedAt", "desc"),
    limit(50),
  );

export const qAppointmentsForRepDay = (
  workspaceId: string,
  repUserId: string,
  start: Date,
  end: Date,
) =>
  query(
    collection(db, "appointments"),
    where("workspaceId", "==", workspaceId),
    where("assignedToUserId", "==", repUserId),
    where("startAt", ">=", Timestamp.fromDate(start)),
    where("startAt", "<", Timestamp.fromDate(end)),
    orderBy("startAt", "asc"),
    limit(200),
  );

export const qCustomersNewest = (workspaceId: string) =>
  query(
    collection(db, "customers"),
    where("workspaceId", "==", workspaceId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
