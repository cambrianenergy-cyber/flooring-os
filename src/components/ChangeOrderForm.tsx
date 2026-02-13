"use client";
import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface ChangeOrderFormProps {
  jobId: string;
  onChangeOrderSaved?: () => void;
}

export default function ChangeOrderForm({ jobId, onChangeOrderSaved }: ChangeOrderFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, "changeOrders"), {
        jobId,
        description,
        amount,
        created: new Date().toISOString(),
      });
      setSaving(false);
      if (onChangeOrderSaved) onChangeOrderSaved();
      window.dispatchEvent(new CustomEvent("toast", { detail: { type: "success", message: "Change order saved!" } }));
    } catch (e) {
      setSaving(false);
      window.dispatchEvent(new CustomEvent("toast", { detail: { type: "error", message: "Failed to save change order." } }));
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded bg-background text-slate-900">
      <h2 className="text-lg font-semibold mb-2">Change Order</h2>
      <div className="mb-2">
        <label className="block mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="border rounded px-2 py-1 w-full" rows={3} />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Amount ($)</label>
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="border rounded px-2 py-1 w-full" />
      </div>
      <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving || !description || !amount}>Save Change Order</button>
    </div>
  );
}
