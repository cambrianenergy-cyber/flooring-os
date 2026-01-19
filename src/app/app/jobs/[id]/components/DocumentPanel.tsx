"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc } from "firebase/firestore";

interface Props {
  jobId: string;
}

interface DocRow {
  id: string;
  name: string;
  url: string;
  createdAt?: any;
}

export default function DocumentPanel({ jobId }: Props) {
  const [docsList, setDocsList] = useState<DocRow[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "documents"), where("jobId", "==", jobId));
        const snap = await getDocs(q);
        setDocsList(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      } catch (e: any) {
        setError(e?.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  const handleAdd = async () => {
    setError(null);
    if (!name.trim() || !url.trim()) {
      setError("Name and URL are required.");
      return;
    }
    try {
      const ref = await addDoc(collection(db, "documents"), {
        jobId,
        name,
        url,
        createdAt: serverTimestamp(),
      });
      setDocsList(prev => [{ id: ref.id, name, url }, ...prev]);
      setName("");
      setUrl("");
    } catch (e: any) {
      setError(e?.message || "Failed to add document");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "documents", id));
      setDocsList(prev => prev.filter(d => d.id !== id));
    } catch (e: any) {
      setError(e?.message || "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="border rounded p-3">
      <h2 className="font-semibold mb-2">Documents</h2>
      <div className="space-y-2">
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="Name (e.g., Proposal)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="URL (e.g., https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add</button>
        {error && <div className="text-xs text-red-500">{error}</div>}
      </div>
      <div className="mt-3 space-y-2 max-h-48 overflow-auto">
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : docsList.length === 0 ? (
          <div className="text-sm text-gray-500">No documents yet.</div>
        ) : (
          docsList.map((d) => (
            <div key={d.id} className="border rounded px-2 py-1 text-sm flex justify-between items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate" title={d.name}>{d.name}</div>
                <div className="text-xs text-gray-500 break-all">{d.url}</div>
              </div>
              <div className="flex items-center gap-2">
                <a className="text-blue-600 text-xs underline" href={d.url} target="_blank" rel="noreferrer">Open</a>
                <button
                  className="text-red-500 text-xs"
                  onClick={() => handleDelete(d.id)}
                  disabled={deletingId === d.id}
                >
                  {deletingId === d.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
