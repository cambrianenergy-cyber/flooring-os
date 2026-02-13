
import { adminDb } from "@/lib/firebaseAdmin";
import { requireWorkspace } from "@/lib/requireAuth";
import { col } from "@/lib/firestorePaths";
import { isFounder } from "@/lib/auth-utils";
import EstimatesClient from "./ui";

type SearchParams = {
  status?: string;
  q?: string;
};

export default async function EstimatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireWorkspace();
  const db = adminDb();

  const params = await searchParams;
  const status = params?.status?.trim() || "all";
  const q = (params?.q || "").trim().toLowerCase();

  let queryRef: FirebaseFirestore.Query = db.collection(col(user.workspaceId, "estimates")).orderBy("createdAt", "desc").limit(50);

  if (status !== "all") queryRef = queryRef.where("status", "==", status);

  const snap = await queryRef.get();
  let items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  if (q) {
    items = items.filter((x) => {
      const hay = `${x.estimateNumber || ""} ${x.customerName || ""} ${x.propertyAddress || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const founder = isFounder(user.role);

  return (
    <EstimatesClient
      founder={founder}
      status={status}
      q={q}
      items={items}
    />
  );
}
