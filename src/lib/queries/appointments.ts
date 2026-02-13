import { db } from "@/lib/firebase/client";
import {
    collection,
    limit,
    orderBy,
    query,
    Timestamp,
    where,
} from "firebase/firestore";

export function qAppointmentsForRepDay(
  workspaceId: string,
  repUserId: string,
  dayStart: Date,
  dayEnd: Date,
) {
  return query(
    collection(db, "appointments"),
    where("workspaceId", "==", workspaceId),
    where("assignedToUserId", "==", repUserId),
    where("startAt", ">=", Timestamp.fromDate(dayStart)),
    where("startAt", "<", Timestamp.fromDate(dayEnd)),
    orderBy("startAt", "asc"),
    limit(200),
  );
}
