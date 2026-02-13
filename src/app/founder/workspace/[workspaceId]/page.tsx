"use client";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Fallback mock for development
const mockWorkspace = {
  id: "mockId",
  name: "Mock Workspace",
  industry: "Flooring",
  plan: "Pro",
  billingStatus: "Active",
  health: "Healthy",
};

type Workspace = {
  id: string;
  name: string;
  industry: string;
  plan: string;
  billingStatus: string;
  health: string;
};

export default function WorkspaceDrilldownPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const router = useRouter();
  const { workspaceId } = params;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const docRef = doc(db, "workspaces", workspaceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() || {};
          setWorkspace({
            id: docSnap.id,
            name: data.name ?? "",
            industry: data.industry ?? "",
            plan: data.plan ?? "",
            billingStatus: data.billingStatus ?? "",
            health: data.health ?? "",
          });
        } else {
          setWorkspace(mockWorkspace);
        }
      } catch {
        setWorkspace(mockWorkspace);
      }
      setLoading(false);
    }
    fetchWorkspace();
  }, [workspaceId]);

  if (loading) return <div>Loading workspace...</div>;
  if (!workspace) return <div>Workspace not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-2">{workspace.name}</h1>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500">Industry</div>
          <div className="font-semibold">{workspace.industry || "-"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Plan</div>
          <div className="font-semibold">{workspace.plan || "-"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Billing Status</div>
          <div className="font-semibold">{workspace.billingStatus || "-"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Health</div>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-bold ${workspace.health === "Healthy" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {workspace.health || "Unknown"}
          </span>
        </div>
      </div>
      <div className="flex gap-3 mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => router.push(`/dashboard/${workspace.id}`)}
        >
          Open Workspace
        </button>
        <button
          className="bg-gray-100 text-blue-700 px-4 py-2 rounded shadow hover:bg-blue-200"
          onClick={() =>
            router.push(`/founder/workspace/${workspace.id}/contracts`)
          }
        >
          View Contracts
        </button>
        <button
          className="bg-gray-100 text-blue-700 px-4 py-2 rounded shadow hover:bg-blue-200"
          onClick={() =>
            router.push(`/founder/workspace/${workspace.id}/estimates`)
          }
        >
          View Estimates
        </button>
      </div>
    </div>
  );
}
