// ManualMeasureMode.tsx
// UI for manual room drawing and distance entry

"use client";
import React, { useState } from "react";

export default function ManualMeasureMode({ onComplete }: { onComplete?: (data: any) => void }) {
  const [shape, setShape] = useState<string>("");
  const [distances, setDistances] = useState<number[]>([]);
  const [current, setCurrent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function handleAddDistance() {
    const val = parseFloat(current);
    if (!isNaN(val) && val > 0) {
      setDistances((prev) => [...prev, val]);
      setCurrent("");
      setError(null);
    }
  }

  function handleFinish() {
    if (!shape) {
      setError("Select a room shape");
      return;
    }

    if (distances.length < 2) {
      setError("Add at least two distances");
      return;
    }

    setError(null);
    if (onComplete) onComplete({ shape, distances });
  }

  return (
    <div className="p-4 border rounded max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Manual Measure Mode</h2>
      <div className="mb-2">
        <label className="block mb-1">Room Shape</label>
        <select value={shape} onChange={e => setShape(e.target.value)} className="border rounded px-2 py-1 w-full">
          <option value="">Select shape</option>
          <option value="rectangle">Rectangle</option>
          <option value="l-shape">L-Shape</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block mb-1">Add Wall Distance (ft)</label>
        <input type="number" value={current} onChange={e => setCurrent(e.target.value)} className="border rounded px-2 py-1 w-full" />
        <button onClick={handleAddDistance} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Add</button>
      </div>
      <div className="mb-2">
        <div className="font-medium">Distances:</div>
        <ul className="list-disc ml-6">
          {distances.map((d, i) => <li key={i}>{d} ft</li>)}
        </ul>
      </div>
      {error && (
        <div className="mb-2 text-sm text-red-700">{error}</div>
      )}
      <button onClick={handleFinish} className="px-4 py-2 bg-green-700 text-white rounded" disabled={!shape || distances.length < 2}>Finish</button>
    </div>
  );
}
