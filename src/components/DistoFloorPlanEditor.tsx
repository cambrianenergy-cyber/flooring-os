
"use client";
import React, { useMemo, useState } from "react";
import { LeicaBLEManager } from "@/lib/leica/LeicaBLEManager";

type Point = { x: number; y: number };
const ACCESSORY_LIST = [
  "Quarter Round",
  "Baseboard",
  "Transition Strips",
  "Underlayment",
  "Moisture Barrier",
];

interface DistoFloorPlanEditorProps {
  roomId: string;
  onSave: (data: {
    mode: string;
    points: { x: number; y: number }[];
    showGrid: boolean;
    snap: boolean;
    stairs: boolean;
    numSteps: number;
    transitions: boolean;
    waste: number;
    accessories: string[];
    createdAt: string;
  }) => Promise<void>;
}

export default function DistoFloorPlanEditor({ roomId, onSave }: DistoFloorPlanEditorProps) {
      const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [bleManager] = useState(() => new LeicaBLEManager());
    const [distoConnected, setDistoConnected] = useState(false);
    const [distoError, setDistoError] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
  // UI state
  const [mode, setMode] = useState<"draw" | "measure">("draw");
  const [showGrid, setShowGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [stairs, setStairs] = useState(false);
  const [numSteps, setNumSteps] = useState(1);
  const [transitions, setTransitions] = useState(false);
  const [waste, setWaste] = useState(10);
  const [accessories, setAccessories] = useState<string[]>([]);
  // Drawing state
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const canvasSize = 400;
  const gridSize = 10;

  const snapped = (n: number) => (snap ? Math.round(n / gridSize) * gridSize : n);

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (editing) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = snapped(e.clientX - rect.left);
    const y = snapped(e.clientY - rect.top);
    setPoints((prev) => [...prev, { x, y }]);
  }

  async function handleConnectDisto() {
    setConnecting(true);
    setDistoError(null);
    try {
      await bleManager.connect();
      setDistoConnected(true);
      bleManager.onDisconnect = () => setDistoConnected(false);
    } catch (e: any) {
      setDistoError(e.message || "Failed to connect to Disto");
      setDistoConnected(false);
    } finally {
      setConnecting(false);
    }
  }

  async function handleAddMeasurementFromDisto() {
    if (!distoConnected) return;
    try {
      const distance = await bleManager.getLastMeasurement();
      if (distance != null) {
        // Add as a new point (for demo, place at center)
        setPoints((prev) => [...prev, { x: canvasSize / 2, y: canvasSize / 2 }]);
        // TODO: Use actual direction/angle if available
      } else {
        setDistoError("No measurement received");
      }
    } catch (e: any) {
      setDistoError(e.message || "Failed to get measurement");
    }
  }

  function handleEditPoint(index: number) {
    setSelectedIdx(index);
    setEditing(true);
  }

  function handleMovePoint(dx: number, dy: number) {
    setPoints((prev) =>
      prev.map((p, i) => {
        if (i !== selectedIdx) return p;
        const nx = Math.max(0, Math.min(canvasSize, p.x + dx));
        const ny = Math.max(0, Math.min(canvasSize, p.y + dy));
        return { x: snapped(nx), y: snapped(ny) };
      })
    );
  }

  function handleUndo() {
    setPoints((prev) => prev.slice(0, -1));
  }

  async function handleFinish() {
    const payload = {
      mode,
      points,
      showGrid,
      snap,
      stairs,
      numSteps: stairs ? numSteps : 0,
      transitions,
      waste,
      accessories,
      createdAt: new Date().toISOString(),
    };
    try {
      await onSave(payload);
    } catch (e: any) {
      alert("Failed to save CAD: " + (e.message || e));
    }
  }

  const polylinePoints = useMemo(
    () => points.map((pt) => `${pt.x},${pt.y}`).join(" "),
    [points]
  );

  return (
    <div className="border rounded p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Floor Plan Editor (DISTO)</h2>
      <div className="flex gap-2 mb-2 items-center">
        <button onClick={() => setMode("draw")}
          className={`px-2 py-1 rounded ${mode === "draw" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Draw</button>
        <button onClick={() => setMode("measure")}
          className={`px-2 py-1 rounded ${mode === "measure" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Measure</button>
        {/* Undo button */}
        <button onClick={() => setPoints(points.slice(0, -1))} disabled={points.length === 0} title="Undo" className="p-2 rounded bg-gray-200 hover:bg-gray-300 flex items-center">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C6.23858 1 3.82843 2.34315 2.34315 4.34315M2 7V4.5C2 3.67157 2.67157 3 3.5 3H6" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button
          onClick={handleConnectDisto}
          className={`px-2 py-1 rounded ${distoConnected ? "bg-green-600 text-white" : "bg-yellow-500 text-black"} cursor-pointer`}
          disabled={distoConnected || connecting}
        >
          {distoConnected ? "Disto Connected" : connecting ? "Connecting..." : "Connect Disto"}
        </button>
        <button
          onClick={handleAddMeasurementFromDisto}
          className="px-2 py-1 rounded bg-blue-700 text-white cursor-pointer"
          disabled={!distoConnected}
        >
          Add Measurement from Disto
        </button>
        {distoError && <span className="text-red-600 text-xs ml-2">{distoError}</span>}
        {/* ...existing controls... */}
        {/* Dropdown for grid, snap, stairs */}
        <div className="relative">
          <button type="button" className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer" onClick={() => setShowDropdown(d => !d)}>
            Settings ▾
          </button>
          {showDropdown && (
            <div className="absolute left-0 mt-2 w-48 bg-white border rounded shadow-lg z-10 p-3 flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Grid
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={snap} onChange={e => setSnap(e.target.checked)} /> Snap
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={stairs} onChange={e => setStairs(e.target.checked)} /> Stairs
              </label>
              {stairs && (
                <label className="flex items-center gap-2">
                  Steps
                  <input type="number" min={1} value={numSteps} onChange={e => setNumSteps(Number(e.target.value))} className="border rounded px-1 py-0.5 w-16" />
                </label>
              )}
            </div>
          )}
        </div>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={transitions} onChange={e => setTransitions(e.target.checked)} /> Transitions
        </label>
        <label className="flex items-center gap-1">
          Waste
          <select value={waste} onChange={e => setWaste(Number(e.target.value))} className="border rounded px-1 py-0.5">
            {[5, 10, 12, 15].map(w => <option key={w} value={w}>{w}%</option>)}
          </select>
        </label>
      </div>
      {/* Accessory add-on list */}
      <div className="mb-2 flex flex-wrap gap-2 items-center">
        <span className="font-medium text-sm">Accessories:</span>
        <button
          type="button"
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs cursor-pointer"
          onClick={() => setAccessories([...ACCESSORY_LIST])}
        >
          Seed Demo Accessories
        </button>
        {ACCESSORY_LIST.map(acc => (
          <label key={acc} className="flex items-center gap-1 border rounded px-2 py-1 text-xs cursor-pointer">
            <input type="checkbox" checked={accessories.includes(acc)} onChange={e => setAccessories(a => e.target.checked ? [...a, acc] : a.filter(x => x !== acc))} />
            {acc}
          </label>
        ))}
      </div>
      <div
        className="relative border bg-gray-50 mb-2"
        style={{ width: 400, height: 400, cursor: mode === "draw" ? "crosshair" : "pointer" }}
        onClick={handleCanvasClick}
      >
        {showGrid && (
          <svg width={400} height={400} className="absolute top-0 left-0">
            {[...Array(41)].map((_, i) => (
              <line key={i} x1={i * 10} y1={0} x2={i * 10} y2={400} stroke="#eee" />
            ))}
            {[...Array(41)].map((_, i) => (
              <line key={i} x1={0} y1={i * 10} x2={400} y2={i * 10} stroke="#eee" />
            ))}
          </svg>
        )}
        <svg width={400} height={400} className="absolute top-0 left-0">
          {points.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={5} fill={selectedIdx === i ? "#f59e42" : "#2563eb"} onClick={e => { e.stopPropagation(); handleEditPoint(i); }} />
          ))}
          {points.length > 1 && (
            <polyline points={points.map(pt => `${pt.x},${pt.y}`).join(" ")} fill="none" stroke="#2563eb" strokeWidth={2} />
          )}
        </svg>
      </div>
      {editing && selectedIdx != null && (
        <div className="mb-2 flex gap-2 items-center">
          <span>Edit Point {selectedIdx + 1}</span>
          <button onClick={() => handleMovePoint(-10, 0)} className="px-2">←</button>
          <button onClick={() => handleMovePoint(10, 0)} className="px-2">→</button>
          <button onClick={() => handleMovePoint(0, -10)} className="px-2">↑</button>
          <button onClick={() => handleMovePoint(0, 10)} className="px-2">↓</button>
          <button onClick={() => setEditing(false)} className="px-2 text-red-600">Done</button>
        </div>
      )}
      <button onClick={handleFinish} className="mt-2 px-4 py-2 bg-green-700 text-white rounded">Finish & Send</button>
    </div>
  );
}
