import React, { useState } from "react";

export default function PunchList({ jobId }: { jobId: string }) {
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [signedOff, setSignedOff] = useState(false);

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const signOff = () => {
    setSignedOff(true);
    // TODO: Save sign-off to Firestore
  };

  return (
    <div className="border rounded p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">Punch List</h2>
      <ul className="mb-2">
        {items.map((item, i) => (
          <li key={i} className="mb-1">{item}</li>
        ))}
      </ul>
      <div className="flex gap-2 mb-2">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Add punch item..."
          className="border rounded px-2 py-1 flex-1"
        />
        <button onClick={addItem} className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
      </div>
      <button
        onClick={signOff}
        className="px-4 py-2 bg-green-700 text-white rounded"
        disabled={signedOff || items.length === 0}
      >
        {signedOff ? "Signed Off" : "Sign Off"}
      </button>
    </div>
  );
}
