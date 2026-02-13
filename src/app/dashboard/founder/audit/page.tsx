import { adminDb } from "@/lib/firebaseAdmin";
import { col } from "@/lib/firestorePaths";
import { requireFounder } from "@/lib/requireAuth";

export default async function FounderAuditPage({
  searchParams,
}: {
  searchParams: { type?: string; actor?: string };
}) {
  const user = await requireFounder();
  const db = adminDb();

  const type = (searchParams.type || "all").trim();
  const actor = (searchParams.actor || "").trim();

  let q: FirebaseFirestore.Query = db
    .collection(col(user.workspaceId, "audit_logs"))
    .orderBy("createdAt", "desc")
    .limit(120);

  if (type !== "all") q = q.where("entityType", "==", type);
  if (actor) q = q.where("actorUid", "==", actor);

  type AuditLog = {
    id: string;
    action: string;
    entityType: string;
    entityId?: string;
    createdAt?: { toDate?: () => Date };
    actorUid?: string;
    reason?: string;
    [key: string]: unknown;
  };

  const snap = await q.get();
  const logs: AuditLog[] = snap.docs.map((d) => {
    const data = d.data() as Partial<AuditLog>;
    return {
      id: d.id,
      action: data.action ?? "",
      entityType: data.entityType ?? "",
      entityId: data.entityId,
      createdAt: data.createdAt,
      actorUid: data.actorUid,
      reason: data.reason,
      ...data,
    };
  });

  return (
    <div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
      <div className="text-2xl font-semibold">Audit Log (Founder)</div>
      <div className="text-sm text-neutral-600">
        Every sensitive action, time-stamped.
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          className="rounded-2xl border px-3 py-2 text-sm"
          href="/dashboard/founder/audit?type=all"
        >
          All
        </a>
        <a
          className="rounded-2xl border px-3 py-2 text-sm"
          href="/dashboard/founder/audit?type=estimate"
        >
          Estimates
        </a>
        <a
          className="rounded-2xl border px-3 py-2 text-sm"
          href="/dashboard/founder/audit?type=job"
        >
          Jobs
        </a>
        <a
          className="rounded-2xl border px-3 py-2 text-sm"
          href="/dashboard/founder/audit?type=invoice"
        >
          Invoices
        </a>
        <a
          className="rounded-2xl border px-3 py-2 text-sm"
          href="/dashboard/founder/audit?type=policy"
        >
          Policies
        </a>
      </div>

      <div className="mt-6 space-y-3">
        {logs.map((x) => (
          <div key={x.id} className="rounded-2xl bg-neutral-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">
                {x.action} •{" "}
                <span className="text-neutral-600">{x.entityType}</span>
                {x.entityId ? (
                  <span className="text-neutral-500"> • {x.entityId}</span>
                ) : null}
              </div>
              <div className="text-xs text-neutral-500">
                {x.createdAt?.toDate
                  ? x.createdAt.toDate().toLocaleString()
                  : ""}
              </div>
            </div>
            <div className="mt-1 text-sm text-neutral-700">
              Actor: {x.actorUid}
            </div>
            {x.reason ? (
              <div className="mt-1 text-sm text-neutral-700">
                Reason: {x.reason}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
