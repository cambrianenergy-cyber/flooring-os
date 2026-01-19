"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc, collection, addDoc } from "firebase/firestore";

export default function LeadDetailPage() {
  const params = useParams() ?? {};
  const router = useRouter();
  // params is Record<string, string | string[]> | null
  const idParam = params["id"] ?? "";
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  type Lead = { id: string; name: string; stage: string; source: string; rep: string; [key: string]: unknown } | null;
  type Note = { text: string; created: string };
  const [lead, setLead] = useState<Lead>(null);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchLead = async () => {
      const docRef = doc(db, "leads", id as string);
      const snap = await getDoc(docRef);
      const data = snap.data() ?? {};
      setLead({
        id: snap.id,
        name: typeof data.name === 'string' ? data.name : '',
        stage: typeof data.stage === 'string' ? data.stage : '',
        source: typeof data.source === 'string' ? data.source : '',
        rep: typeof data.rep === 'string' ? data.rep : '',
        ...data,
      });
      // Fetch notes (subcollection)
      const notesSnap = await getDoc(doc(db, `leads/${id}/notes`, "timeline"));
      setNotes(notesSnap.exists() ? notesSnap.data().items || [] : []);
      setLoading(false);
    };
    fetchLead();
  }, [id]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    const notesRef = doc(db, `leads/${id}/notes`, "timeline");
    const newNotes = [...notes, { text: note, created: new Date().toISOString() }];
    await setDoc(notesRef, { items: newNotes });
    setNotes(newNotes);
    setNote("");
  };

  const handleConvert = async () => {
    setConverting(true);
    // Create job from lead
    if (!lead) return;
    const jobData = { ...lead, leadId: lead.id, created: new Date().toISOString(), stage: "New" };
    const jobsCol = collection(db, "jobs");
    const jobDoc = await addDoc(jobsCol, jobData);
    // Update lead stage
    await updateDoc(doc(db, "leads", lead.id), { stage: "Converted", convertedToJob: jobDoc.id });
    setConverting(false);
    router.push(`/app/jobs/${jobDoc.id}`);
  };

  if (loading) return <div className="text-[#9fb2c9]">Loading...</div>;
  if (!lead) return <div className="text-[#ff9b76]">Lead not found</div>;

  return (
    <div className="max-w-xl mx-auto p-4 text-[#e8edf7]">
      <h1 className="text-2xl font-semibold mb-2 text-[#e8edf7]">{lead.name}</h1>
      <div className="mb-2 text-[#9fb2c9]">Stage: {lead.stage}</div>
      <div className="mb-2 text-[#9fb2c9]">Source: {lead.source}</div>
      <div className="mb-2 text-[#9fb2c9]">Rep: {lead.rep}</div>
      <div className="flex gap-2 mb-4">
        <a href={`tel:${lead.phone || ""}`} className="px-3 py-1 bg-[#59f2c2] text-[#0c111a] rounded font-medium">Call</a>
        <a href={`sms:${lead.phone || ""}`} className="px-3 py-1 bg-[#76a1ff] text-[#0c111a] rounded font-medium">Text</a>
        {lead.stage !== "Converted" && (
          <button onClick={handleConvert} disabled={converting} className="px-3 py-1 bg-[#ff9b76] text-[#0c111a] rounded font-medium">
            {converting ? "Converting..." : "Convert to Job"}
          </button>
        )}
      </div>
      <h2 className="font-semibold mb-2 text-[#e8edf7]">Notes Timeline</h2>
      <ul className="mb-2">
        {notes.map((n, i) => (
          <li key={i} className="mb-1 text-[#e8edf7] border-b border-[#1b2435] pb-1">
            <span className="text-xs text-[#7985a8] mr-2">{new Date(n.created).toLocaleString()}</span>
            {n.text}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add note..." className="border rounded px-2 py-1 flex-1 bg-[#0f1624] text-[#e8edf7] border-[#1b2435] placeholder-[#7985a8]" />
        <button onClick={handleAddNote} className="px-3 py-1 bg-[#59f2c2] text-[#0c111a] rounded font-medium">Add</button>
      </div>
    </div>
  );
}
