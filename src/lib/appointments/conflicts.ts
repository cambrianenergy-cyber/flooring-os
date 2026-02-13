import { db } from "@/lib/firebase/client";
import {
    collection,
    getDocs,
    query,
    Timestamp,
    where,
} from "firebase/firestore";

/**
 * Returns all conflicting appointments for a user in a workspace.
 * @param args - Appointment details to check for conflicts.
 * @returns Array of conflicting appointments (with id and data). Empty if no conflicts.
 */
export async function getConflictingAppointments(args: {
  workspaceId: string;
  assignedToUserId: string;
  startAt: Date;
  endAt: Date;
  excludeAppointmentId?: string;
}): Promise<Array<{ id: string; data: any }>> {
  const q = query(
    collection(db, "appointments"),
    where("workspaceId", "==", args.workspaceId),
    where("assignedToUserId", "==", args.assignedToUserId),
    where("startAt", "<", Timestamp.fromDate(args.endAt)),
    where("endAt", ">", Timestamp.fromDate(args.startAt)),
  );

  const snap = await getDocs(q);
  const hits = snap.docs.filter((d) => d.id !== args.excludeAppointmentId);
  return hits.map((d) => ({ id: d.id, data: d.data() }));
}
