/**
 * iPhone-Optimized Geometry Interface
 *
 * Compact, touch-friendly editing for field work:
 * - Tap-to-place points
 * - Drag to move walls
 * - Numeric input for precision
 * - Leica Bluetooth for distance capture
 * - Optimized for one-handed operation
 */

"use client";

import { FeatureGate } from "@/components/FeatureGate";
import { GeometryEngine } from "@/lib/GeometryEngine";
import { GeometryValidator } from "@/lib/GeometryValidation";
import { SNAP_PRESETS } from "@/lib/SnapRules";
import type { GeometryData } from "@/lib/geometrySchema";
import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// Input Modes
// ============================================================================

type InputMode = "tap" | "drag" | "numeric" | "walk-the-room" | "rect-by-size";

type ValidationIssue = { message: string };

interface GeometryUIState {
  geometry: GeometryData;
  inputMode: InputMode;
  selectedPointId: string | null;
  showNumericInput: boolean;
  showSnapPresets: boolean;
  validationErrors: ValidationIssue[];
}

// ============================================================================
// Main iPhone Geometry Editor
// ============================================================================

export interface IPhoneGeometryEditorProps {
  roomId: string;
  jobId: string;

  // Called when user saves geometry
  onSave?: (geometry: GeometryData) => void;

  // Optional initial geometry to load
  initialGeometry?: GeometryData;

  // Optional: if you want FeatureGate to depend on plan/workspace
  workspaceId?: string;

  // Optional: disable save button while parent is saving
  isSaving?: boolean;
}

export function IPhoneGeometryEditor({
  roomId,
  jobId,
  onSave,
  initialGeometry,
  isSaving,
}: IPhoneGeometryEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initialGeometryRef = useRef<GeometryData>(
    initialGeometry || {
      roomId,
      jobId,
      workspaceId: "",
      points: [],
      segments: [],
      labels: [],
      layers: [],
      constraints: [],
      mode: "points",
      closedPolygon: false,
      perimeter: 0,
      area: 0,
      version: 0,
      updatedAt: 0,
      updatedBy: "user",
      id: "",
    },
  );

  // State
  const [state, setState] = useState<GeometryUIState>(() => ({
    geometry: {
      roomId,
      jobId,
      workspaceId: "",
      points: [],
      segments: [],
      labels: [],
      layers: [],
      constraints: [],
      mode: "points",
      closedPolygon: false,
      perimeter: 0,
      area: 0,
      version: 0,
      updatedAt: 0,
      updatedBy: "user",
      id: "",
    },
    inputMode: "tap",
    selectedPointId: null,
    showNumericInput: false,
    showSnapPresets: false,
    validationErrors: [],
  }));

  // Set initial geometry from ref after mount
  useEffect(() => {
    if (initialGeometryRef.current) {
      setState((prev) => ({ ...prev, geometry: initialGeometryRef.current }));
    }
  }, []);

  const [snapMode, setSnapMode] = useState("normal");

  const engine = useRef(new GeometryEngine(state.geometry));

  // =========================================================================
  // Canvas Drawing
  // =========================================================================

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PIXELS_PER_FOOT = 30; // Tighter zoom for phone
    const POINT_RADIUS = 6;

    // Clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += PIXELS_PER_FOOT * 2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += PIXELS_PER_FOOT * 2) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw segments
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    for (const segment of state.geometry.segments) {
      const p1 = state.geometry.points.find((p) => p.id === segment.p1Id);
      const p2 = state.geometry.points.find((p) => p.id === segment.p2Id);
      if (!p1 || !p2) continue;

      ctx.beginPath();
      ctx.moveTo(p1.x * PIXELS_PER_FOOT, p1.y * PIXELS_PER_FOOT);
      ctx.lineTo(p2.x * PIXELS_PER_FOOT, p2.y * PIXELS_PER_FOOT);
      ctx.stroke();
    }

    // Draw points
    for (const point of state.geometry.points) {
      const isSelected = point.id === state.selectedPointId;
      ctx.fillStyle = isSelected ? "#FF6B6B" : "#4A90E2";
      ctx.beginPath();
      ctx.arc(
        point.x * PIXELS_PER_FOOT,
        point.y * PIXELS_PER_FOOT,
        POINT_RADIUS,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Label
      ctx.fillStyle = "#000000";
      ctx.font = "10px sans-serif";
      ctx.fillText(
        `${point.x.toFixed(1)},${point.y.toFixed(1)}`,
        point.x * PIXELS_PER_FOOT + 8,
        point.y * PIXELS_PER_FOOT - 8,
      );
    }
  }, [state.geometry, state.selectedPointId]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // =========================================================================
  // Input Methods
  // =========================================================================

  const handleTapToPlace = useCallback(
    (x: number, y: number) => {
      // Validate placement
      const error = GeometryValidator.validatePointPlacement(
        x,
        y,
        state.geometry,
      );
      if (error) {
        setState((prev) => ({ ...prev, validationErrors: [error] }));
        return;
      }

      // Add point via engine
      try {
        const point = engine.current.addPoint(x, y);
        const updated = engine.current.geometry;

        // Auto-create segment if we have 2+ points
        if (updated.points.length >= 2) {
          const lastPoint = updated.points[updated.points.length - 2];
          const segError = GeometryValidator.validateSegmentCreation(
            lastPoint.id,
            point.id,
            updated,
          );
          if (!segError) {
            engine.current.addSegment(lastPoint.id, point.id, "wall");
          }
        }

        setState((prev) => ({
          ...prev,
          geometry: engine.current.geometry,
          validationErrors: [],
        }));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to add point";
        setState((prev) => ({
          ...prev,
          validationErrors: [{ message }],
        }));
      }
    },
    [state.geometry],
  );

  // =========================================================================
  // Canvas Touch Handling
  // =========================================================================

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / 30; // PIXELS_PER_FOOT
      const y = (e.clientY - rect.top) / 30;

      if (state.inputMode === "tap") {
        handleTapToPlace(x, y);
      }
    },
    [handleTapToPlace, state.inputMode],
  );

  const handleNumericInput = (x: string, y: string) => {
    try {
      const pointX = parseFloat(x);
      const pointY = parseFloat(y);
      if (isNaN(pointX) || isNaN(pointY)) return;

      handleTapToPlace(pointX, pointY);
      setState((prev) => ({ ...prev, showNumericInput: false }));
    } catch (err) {
      console.error("Invalid coordinates", err);
    }
  };

  const handleClosePolygon = () => {
    const error = GeometryValidator.validatePolygonClosure(state.geometry);
    if (error) {
      setState((prev) => ({ ...prev, validationErrors: [error] }));
      return;
    }

    try {
      engine.current.closePolygon();
      setState((prev) => ({
        ...prev,
        geometry: engine.current.geometry,
        validationErrors: [],
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to close polygon";
      setState((prev) => ({
        ...prev,
        validationErrors: [{ message }],
      }));
    }
  };

  const handleUndo = () => {
    try {
      engine.current.undo();
      setState((prev) => ({ ...prev, geometry: engine.current.geometry }));
    } catch {
      // Already at oldest frame
    }
  };

  const handleRedo = () => {
    try {
      engine.current.redo();
      setState((prev) => ({ ...prev, geometry: engine.current.geometry }));
    } catch {
      // Already at newest frame
    }
  };

  // Avoid accessing refs during render: useMemo for computed, state for undo/redo
  const [computed, setComputed] = useState<
    import("@/lib/geometrySchema").ComputedGeometry | null
  >(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    setComputed(engine.current.exportComputed());
    setCanUndo(engine.current.undoStack.length > 0);
    setCanRedo(engine.current.redoStack.length > 0);
  }, [state.geometry]);

  // =========================================================================
  // Render: iPhone Compact Layout
  // =========================================================================

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-gray-900">
            Room: {roomId}
          </h2>
          <p className="text-xs text-gray-500">
            {state.geometry.points.length} points •{" "}
            {computed ? computed.area.toFixed(0) : 0} sqft
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <button
              type="button"
              disabled={!!isSaving}
              onClick={() => onSave?.(state.geometry)}
              className="rounded px-2 py-1 text-xs font-semibold text-green-600 border border-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          )}
          <button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                showSnapPresets: !prev.showSnapPresets,
              }))
            }
            className="rounded px-2 py-1 text-xs font-semibold text-blue-600 border border-blue-300"
          >
            Snap: {snapMode}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-50 p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={480}
          onClick={handleCanvasClick}
          className="w-full border border-gray-200 rounded-lg bg-white text-slate-900 cursor-crosshair"
        />
      </div>

      {/* Input Mode Tabs */}
      <div className="flex gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 overflow-x-auto">
        <button
          onClick={() => setState((prev) => ({ ...prev, inputMode: "tap" }))}
          className={`px-3 py-2 text-xs font-semibold rounded whitespace-nowrap ${
            state.inputMode === "tap"
              ? "bg-blue-500 text-white"
              : "bg-white border border-gray-300 text-gray-700"
          }`}
        >
          Tap Place
        </button>
        <button
          onClick={() =>
            setState((prev) => ({ ...prev, showNumericInput: true }))
          }
          className="px-3 py-2 text-xs font-semibold rounded whitespace-nowrap bg-white border border-gray-300 text-gray-700"
        >
          Numeric
        </button>

        <FeatureGate name="leiacBluetooth">
          <button className="px-3 py-2 text-xs font-semibold rounded whitespace-nowrap bg-white border border-blue-300 text-blue-600">
            Leica BLE
          </button>
        </FeatureGate>

        <FeatureGate name="walkTheRoom">
          <button className="px-3 py-2 text-xs font-semibold rounded whitespace-nowrap bg-white border border-purple-300 text-purple-600">
            Walk Room
          </button>
        </FeatureGate>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t border-gray-200 bg-white text-slate-900 px-4 py-3">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="flex-1 px-3 py-2 text-sm font-semibold rounded bg-gray-100 text-gray-700 disabled:opacity-50"
        >
          ↶ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className="flex-1 px-3 py-2 text-sm font-semibold rounded bg-gray-100 text-gray-700 disabled:opacity-50"
        >
          ↷ Redo
        </button>
        {!state.geometry.closedPolygon && state.geometry.points.length >= 3 && (
          <button
            onClick={handleClosePolygon}
            className="flex-1 px-3 py-2 text-sm font-semibold rounded bg-green-500 text-white"
          >
            ✓ Close
          </button>
        )}
      </div>

      {/* Validation Errors */}
      {state.validationErrors.length > 0 && (
        <div className="border-t border-red-300 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-700">
            {state.validationErrors[0].message}
          </p>
        </div>
      )}

      {/* Numeric Input Modal */}
      {state.showNumericInput && (
        <NumericInputModal
          onSubmit={handleNumericInput}
          onClose={() =>
            setState((prev) => ({ ...prev, showNumericInput: false }))
          }
        />
      )}

      {/* Snap Presets */}
      {state.showSnapPresets && (
        <div className="absolute bottom-20 left-4 right-4 bg-white text-slate-900 border border-gray-200 rounded-lg shadow-lg p-3">
          {Object.keys(SNAP_PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => {
                setSnapMode(key);
                setState((prev) => ({ ...prev, showSnapPresets: false }));
              }}
              className={`block w-full text-left px-3 py-2 text-sm rounded ${
                snapMode === key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Numeric Input Modal
// ============================================================================

interface NumericInputModalProps {
  onSubmit: (x: string, y: string) => void;
  onClose: () => void;
}

function NumericInputModal({ onSubmit, onClose }: NumericInputModalProps) {
  const [x, setX] = useState("");
  const [y, setY] = useState("");

  return (
    <div className="fixed inset-0 flex items-end bg-overlay bg-opacity-50">
      <div className="w-full bg-white text-slate-900 rounded-t-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Enter Coordinates
        </h3>

        <div className="space-y-2">
          <label className="block text-xs text-muted">X (feet)</label>
          <input
            type="number"
            value={x}
            onChange={(e) => setX(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            step="0.5"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-muted">Y (feet)</label>
          <input
            type="number"
            value={y}
            onChange={(e) => setY(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            step="0.5"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit(x, y);
            }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg"
          >
            Add Point
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default IPhoneGeometryEditor;
