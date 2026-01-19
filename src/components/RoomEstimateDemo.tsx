"use client";
import React, { useState } from "react";
import { calculateRoomEstimate } from "@/lib/estimatingEngine";

export default function RoomEstimateDemo() {
  const [sqft, setSqft] = useState(200);
  const [pricePerSqft, setPricePerSqft] = useState(4.5);
  const [wastePercent, setWastePercent] = useState(10);
  const [overridePrice, setOverridePrice] = useState("");
  const [baseLaborRate, setBaseLaborRate] = useState(1.25);
  const [laborMultiplier, setLaborMultiplier] = useState(1);

  const estimate = calculateRoomEstimate({
    room: {
      sqft,
      pricePerSqft,
      wastePercent,
      overridePrice: overridePrice ? Number(overridePrice) : null,
      baseLaborRate,
      laborMultiplier,
    },
  });

  return (
    <div className="max-w-md mx-auto p-6 border rounded space-y-4 bg-white">
      <h2 className="text-xl font-bold mb-2">Room Estimate Demo</h2>
      <div className="space-y-2">
        <label className="block">
          Sqft:
          <input type="number" className="ml-2 border rounded px-2 py-1" value={sqft} onChange={e => setSqft(Number(e.target.value))} />
        </label>
        <label className="block">
          Price per Sqft:
          <input type="number" step="0.01" className="ml-2 border rounded px-2 py-1" value={pricePerSqft} onChange={e => setPricePerSqft(Number(e.target.value))} />
        </label>
        <label className="block">
          Waste %:
          <input type="number" step="1" className="ml-2 border rounded px-2 py-1" value={wastePercent} onChange={e => setWastePercent(Number(e.target.value))} />
        </label>
        <label className="block">
          Override Material Price:
          <input type="number" step="0.01" className="ml-2 border rounded px-2 py-1" value={overridePrice} onChange={e => setOverridePrice(e.target.value)} />
        </label>
        <label className="block">
          Base Labor Rate:
          <input type="number" step="0.01" className="ml-2 border rounded px-2 py-1" value={baseLaborRate} onChange={e => setBaseLaborRate(Number(e.target.value))} />
        </label>
        <label className="block">
          Labor Multiplier:
          <input type="number" step="0.01" className="ml-2 border rounded px-2 py-1" value={laborMultiplier} onChange={e => setLaborMultiplier(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-4 p-4 bg-neutral-50 rounded">
        <div>Material Cost: <span className="font-mono">${estimate.materialCost.toFixed(2)}</span></div>
        <div>Labor Cost: <span className="font-mono">${estimate.laborCost.toFixed(2)}</span></div>
        <div className="font-bold">Total: <span className="font-mono">${estimate.total.toFixed(2)}</span></div>
      </div>
    </div>
  );
}
