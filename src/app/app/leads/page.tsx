"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import WorkflowStepper from "../../../components/WorkflowStepper";

import Link from "next/link";

const STAGES = ["New", "Contacted", "Qualified", "Converted", "Lost"];
const SOURCES = ["Web", "Phone", "Referral", "Walk-in"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stage, setStage] = useState("");
  const [source, setSource] = useState("");
  const [rep, setRep] = useState("");

  useEffect(() => {
    let q = collection(db, "leads");
    // Add filters if selected
    let filters: any[] = [];
    if (stage) filters.push(where("stage", "==", stage));
    if (source) filters.push(where("source", "==", source));
    if (rep) filters.push(where("rep", "==", rep));
    const finalQuery = filters.length ? query(q, ...filters) : q;
    getDocs(finalQuery).then((snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [stage, source, rep]);

  return (
    <div>
      <WorkflowStepper current="Lead" />
      <h1 className="text-2xl font-semibold mb-4">Leads</h1>
      <div className="flex gap-4 mb-4">
        <select value={stage} onChange={e => setStage(e.target.value)} className="border rounded px-2 py-1">
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={source} onChange={e => setSource(e.target.value)} className="border rounded px-2 py-1">
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={rep} onChange={e => setRep(e.target.value)} placeholder="Rep" className="border rounded px-2 py-1" />
      </div>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Stage</th>
            <th className="p-2 text-left">Source</th>
            <th className="p-2 text-left">Rep</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-t">
              <td className="p-2">{lead.name}</td>
              <td className="p-2">{lead.stage}</td>
              <td className="p-2">{lead.source}</td>
              <td className="p-2">{lead.rep}</td>
              <td className="p-2">
                 <Link href={`/app/leads/${lead.id}`} className="text-blue-600 underline">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}