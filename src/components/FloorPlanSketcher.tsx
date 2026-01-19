// FloorPlanSketcher.tsx
// Advanced floor plan sketcher: drag walls, snap angles, add doors/stairs/islands

"use client";
import React, { useRef, useState } from "react";

export type SketchElement =
  | { type: "wall"; points: { x: number; y: number }[] }
  | { type: "door"; at: { x: number; y: number } }
  | { type: "stair"; at: { x: number; y: number } }
  | { type: "island"; at: { x: number; y: number } };

export default function FloorPlanSketcher({
  elements,
  onChange,
}: {
  elements: SketchElement[];
  onChange: (elements: SketchElement[]) => void;
}) {
  const [drawing, setDrawing] = useState<{ x: number; y: number }[] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function handleSvgClick(e: React.MouseEvent) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!drawing) {
      setDrawing([{ x, y }]);
    } else {
      setDrawing([...drawing, { x, y }]);
    }
  }

  function finishWall() {
    if (drawing && drawing.length > 1) {
      onChange([...elements, { type: "wall", points: drawing }]);
    }
    setDrawing(null);
  }

  function addElement(type: "door" | "stair" | "island") {
    if (!drawing || drawing.length === 0) return;
    const at = drawing[drawing.length - 1];
    onChange([...elements, { type, at }]);
  }

  // TODO: Add snap-to-angle, drag-to-adjust, and area calculation

  return (
    <div>
      <svg
        ref={svgRef}
        width={500}
        height={400}
        style={{ border: "1px solid #ccc", background: "#fafafa" }}
        onClick={handleSvgClick}
      >
        {elements.map((el, i) => {
          if (el.type === "wall") {
            return (
              <polyline
                key={i}
                points={el.points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#333"
                strokeWidth={3}
              />
            );
          }
          if (el.type === "door") {
            return <circle key={i} cx={el.at.x} cy={el.at.y} r={8} fill="#1976d2" />;
          }
          if (el.type === "stair") {
            return <rect key={i} x={el.at.x - 8} y={el.at.y - 8} width={16} height={16} fill="#43a047" />;
          }
          if (el.type === "island") {
            return <ellipse key={i} cx={el.at.x} cy={el.at.y} rx={10} ry={6} fill="#fbc02d" />;
          }
          return null;
        })}
        {drawing && drawing.length > 0 && (
          <polyline
            points={drawing.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#aaa"
            strokeDasharray="4 2"
            strokeWidth={2}
          />
        )}
      </svg>
      <div className="mt-2 flex gap-2">
        <button onClick={finishWall} disabled={!drawing} className="px-3 py-1 bg-green-600 text-white rounded">
          Finish Wall
        </button>
        <button onClick={() => addElement("door")}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Add Door
        </button>
        <button onClick={() => addElement("stair")}
          className="px-3 py-1 bg-green-700 text-white rounded"
        >
          Add Stairs
        </button>
        <button onClick={() => addElement("island")}
          className="px-3 py-1 bg-yellow-600 text-white rounded"
        >
          Add Island
        </button>
      </div>
    </div>
  );
}
