import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  QueryConstraint,
} from "firebase/firestore";

export type Estimate = {
  id: string;
  customerName: string;
  address: string;
  estimateNumber: string;
  status: string;
  needsApproval?: boolean;
  createdAt: Date | { toDate: () => Date };
  // Add additional known fields here as needed
  // unknown fields are not recommended, but if required:
  // [key: string]: unknown;
};

export async function fetchEstimates({
  workspaceId,
  status,
  search,
  needsApprovalOnly = false,
}: {
  workspaceId: string;
  status?: string;
  search?: string;
  needsApprovalOnly?: boolean;
}): Promise<Estimate[]> {
  const constraints: QueryConstraint[] = [
    where("workspaceId", "==", workspaceId),
    orderBy("createdAt", "desc"),
  ];
  if (status) constraints.push(where("status", "==", status));
  if (needsApprovalOnly) constraints.push(where("needsApproval", "==", true));
  // Firestore doesn't support OR, so search is client-side filtered
  const q = query(collection(db, "estimates"), ...constraints);
  const snap = await getDocs(q);
  let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Estimate));
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(e =>
      e.customerName?.toLowerCase().includes(s) ||
      e.address?.toLowerCase().includes(s) ||
      e.estimateNumber?.toLowerCase().includes(s)
    );
  }
  return results;
}
