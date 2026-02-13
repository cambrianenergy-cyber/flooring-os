import { db } from "@/lib/firebase";

// NOTE: All systemIssues documents must include a server-written severityRank field (number)
import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

type Issue = {
  id: string;
  [key: string]: unknown;
};

export default function IssuesPanel({
  founderUserId,
  workspaceId,
}: {
  founderUserId: string;
  workspaceId: string;
}) {
  const [billingIssues, setBillingIssues] = useState<Issue[]>([]);
  const [docusignQueue, setDocusignQueue] = useState<Issue[]>([]);
  const [systemIssues, setSystemIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIssues() {
      setLoading(true);
      const fetch = async (col: string) => {
        const q = query(
          collection(db, `founder/${founderUserId}/${col}`),
          where("workspaceId", "==", workspaceId),
          orderBy("createdAt", "desc"),
          limit(10),
        );
        const snap = await getDocs(q);
        return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      };
      const [billing, docusign, system] = await Promise.all([
        fetch("billingIssues"),
        fetch("docusignQueue"),
        fetch("systemIssues"),
      ]);
      setBillingIssues(billing);
      setDocusignQueue(docusign);
      setSystemIssues(system);
      setLoading(false);
    }
    fetchIssues();
  }, [founderUserId, workspaceId]);

  if (loading) return <div>Loading issues…</div>;
  if (!billingIssues.length && !docusignQueue.length && !systemIssues.length)
    return <div>No issues for this workspace.</div>;

  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Workspace Issues</h3>
      {billingIssues.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold text-yellow-700">Billing Issues</div>
          <ul className="list-disc ml-5 text-xs">
            {billingIssues.map((issue) => (
              <li key={issue.id}>{JSON.stringify(issue)}</li>
            ))}
          </ul>
        </div>
      )}
      {docusignQueue.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold text-blue-700">DocuSign Queue</div>
          <ul className="list-disc ml-5 text-xs">
            {docusignQueue.map((issue) => (
              <li key={issue.id}>{JSON.stringify(issue)}</li>
            ))}
          </ul>
        </div>
      )}
      {systemIssues.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold text-red-700">System Issues</div>
          <ul className="list-disc ml-5 text-xs">
            {systemIssues.map((issue) => (
              <li key={issue.id}>{JSON.stringify(issue)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
