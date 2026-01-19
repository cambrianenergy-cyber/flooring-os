// TakeoffGenerator.tsx
// Generates sqft, waste, and linear ft from room drawing or manual input

"use client";
import React from "react";

export default function TakeoffGenerator({ shape, distances, wastePct, onResult }: {
  shape: string;
  distances: number[];
  wastePct: number;
  onResult: (result: { sqft: number; linearFt: number; waste: number }) => void;
}) {
  // Simple area calculation for rectangle
  let sqft = 0;
  let linearFt = 0;
  if (shape === "rectangle" && distances.length >= 2) {
    sqft = distances[0] * distances[1];
    linearFt = 2 * (distances[0] + distances[1]);
  } else if (shape === "l-shape" && distances.length >= 4) {
    // Approximate as two rectangles
    sqft = distances[0] * distances[1] + distances[2] * distances[3];
    linearFt = 2 * (distances[0] + distances[1] + distances[2] + distances[3]);
  } else if (shape === "custom") {
    // TODO: Polygon area
    sqft = 0;
    linearFt = distances.reduce((a, b) => a + b, 0);
  }
  const waste = sqft * (wastePct / 100);

  return (
    <div className="mt-2 p-2 border rounded">
      <div>Sqft: {sqft.toFixed(2)}</div>
      <div>Waste: {waste.toFixed(2)} ({wastePct}%)</div>
      <div>Linear Ft: {linearFt.toFixed(2)}</div>
      <button onClick={() => onResult({ sqft, linearFt, waste })} className="mt-2 px-3 py-1 bg-green-700 text-white rounded">Send to Estimate</button>
    </div>
  );
}
