// RoomDrawingCanvas.tsx
// Canvas for drawing room shapes and walls interactively

"use client";
import React from "react";

export default function RoomDrawingCanvas({ points, onPoint, onFinish }: {
  points: { x: number; y: number }[];
  onPoint: (pt: { x: number; y: number }) => void;
  onFinish: () => void;
}) {
  // Placeholder: just show points for now
  return (
    <div className="border rounded p-4 mt-4">
      <h3 className="font-medium mb-2">Room Drawing (Preview)</h3>
      <div className="mb-2">Points: {points.map((p, i) => `(${p.x},${p.y})`).join(", ")}</div>
      <button onClick={onFinish} className="px-3 py-1 bg-green-600 text-white rounded">Finish Drawing</button>
    </div>
  );
}
