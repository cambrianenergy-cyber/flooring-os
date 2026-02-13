"use client";
import { db } from "@/lib/firebase";
import { useFounderAuth } from "@/lib/useFounderAuth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function FounderAdminTools() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFounderUser, ready, user } = useFounderAuth();
  const founderUserId = user?.uid;
  if (!founderUserId) return <div>Missing founderUserId in context</div>;

  useEffect(() => {
    if (!ready || !isFounderUser) return;
    async function fetchWorkspaces() {
      setLoading(true);
      const q = query(
        collection(db, "workspaces"),
        where("founderUserId", "==", founderUserId),
      );
      const snap = await getDocs(q);
      setWorkspaces(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchWorkspaces();
  }, [ready, isFounderUser, founderUserId]);

  if (!ready) return <div>Loading...</div>;
  if (!isFounderUser) return <div>Access denied.</div>;
  if (loading) return <div>Loading workspaces...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Tools</h1>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Impersonate Workspace</h2>
        {workspaces.length === 0 ? (
          <div>No workspaces found.</div>
        ) : (
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Workspace</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((ws) => (
                <tr key={ws.id} className="border-t">
                  <td className="p-2 font-semibold">
                    {ws.workspaceName || ws.id}
                  </td>
                  <td className="p-2">
                    <button
                      className="text-blue-600 underline"
                      onClick={() => alert(`Impersonate workspace: ${ws.id}`)}
                    >
                      Impersonate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Feature Flags</h2>
        <div>Coming soon</div>
      </div>
    </div>
  );
}
