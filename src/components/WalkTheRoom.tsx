/**
 * WALK-THE-ROOM MODE SPECIFICATION
 *
 * Critical iPhone workflow: User walks the perimeter of a room while
 * holding phone + Leica Disto. Phone captures measurements and auto-places
 * points to form room geometry.
 *
 * Example: 20x15 foot rectangular room
 *   - User starts at corner (0, 0)
 *   - Walks along wall, Leica measures distance
 *   - Phone records: distance=20ft, bearing=90°
 *   - Phone auto-places point at (20, 0)
 *   - User turns, walks next wall (15ft), measurement recorded
 *   - Phone places point at (20, 15)
 *   - After 4 corners, polygon auto-closes
 *   - Geometry saved to Firestore
 */

/**
 * Data structures for walk-the-room
 */

export interface MeasurementCapture {
  // From Leica Disto BLE
  distance: number; // feet
  angle?: number; // degrees (optional compass bearing)
  quality: number; // 0-1 (signal strength, confidence)
  timestamp: number;
  deviceModel: string; // "Leica Disto X4", "Bosch GLM"
}

export interface WalkStep {
  // One walk segment (wall measurement)
  id: string;
  stepNumber: number;
  measurement: MeasurementCapture;

  // Computed position
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  bearing: number; // calculated from movement direction

  // UI state
  confirmed: boolean; // user accepted this measurement
  notes?: string;
}

export interface WalkTheRoomState {
  // Workflow state
  isActive: boolean;
  steps: WalkStep[];
  currentStepNumber: number;

  // Geometry being built
  points: { x: number; y: number }[];
  segments: Array<{
    from: number;
    to: number;
    distance: number;
    bearing: number;
  }>;

  // Device state
  leiacConnected: boolean;
  gpsAvailable: boolean; // optional: helps with bearing
  lastMeasurement?: MeasurementCapture;

  // Calibration
  startPoint: { x: number; y: number }; // where user started (0, 0 by default)
  firstBearing: number; // bearing of first wall (to establish coordinate system)

  // Validation
  autoCloseIfValid: boolean; // auto-close polygon if ring closes
  closingError?: number; // distance between last point and first point
}

/**
 * Walk-the-room engine
 */

export class WalkTheRoomEngine {
  private state: WalkTheRoomState;

  constructor() {
    this.state = {
      isActive: false,
      steps: [],
      currentStepNumber: 0,
      points: [{ x: 0, y: 0 }], // start at origin
      segments: [],
      leiacConnected: false,
      gpsAvailable: false,
      startPoint: { x: 0, y: 0 },
      firstBearing: 90, // assume starting along +X axis (east)
      autoCloseIfValid: true,
    };
  }

  /**
   * Start walk-the-room mode
   * Initialize at origin, wait for first measurement
   */
  start(startPoint: { x: number; y: number } = { x: 0, y: 0 }): void {
    this.state.isActive = true;
    this.state.startPoint = startPoint;
    this.state.points = [startPoint];
    this.state.steps = [];
    this.state.currentStepNumber = 0;
  }

  /**
   * Record a measurement from Leica Disto
   * Automatically place next point based on distance + bearing
   */
  recordMeasurement(
    distance: number, // feet
    bearing?: number, // degrees (optional, default to continuing previous bearing)
  ): WalkStep {
    if (!this.state.isActive) {
      throw new Error("Walk-the-room mode not active");
    }

    // Use previous bearing if not provided
    const currentBearing = bearing ?? this.state.firstBearing;

    // If this is the first step, set the coordinate system
    if (this.state.steps.length === 0) {
      this.state.firstBearing = currentBearing;
    }

    // Calculate next point
    const lastPoint = this.state.points[this.state.points.length - 1];
    const radians = (currentBearing * Math.PI) / 180;
    const nextPoint = {
      x: lastPoint.x + distance * Math.cos(radians),
      y: lastPoint.y + distance * Math.sin(radians),
    };

    const step: WalkStep = {
      id: `step-${this.state.steps.length}`,
      stepNumber: this.state.steps.length + 1,
      measurement: {
        distance,
        angle: bearing,
        quality: 0.95, // placeholder
        timestamp: Date.now(),
        deviceModel: "Leica Disto X4",
      },
      startPoint: lastPoint,
      endPoint: nextPoint,
      bearing: currentBearing,
      confirmed: true,
      notes: "",
    };

    this.state.steps.push(step);
    this.state.points.push(nextPoint);
    this.state.currentStepNumber += 1;
    this.state.lastMeasurement = step.measurement;

    // Check for closure
    if (this.state.points.length >= 3) {
      const closingDistance = this.distance(
        this.state.points[this.state.points.length - 1],
        this.state.points[0],
      );
      this.state.closingError = closingDistance;

      // Auto-close if very close (within 1 foot)
      if (this.state.autoCloseIfValid && closingDistance < 1.0) {
        this.autoClose();
      }
    }

    return step;
  }

  /**
   * User can adjust a measurement before it's locked in
   */
  adjustMeasurement(stepNumber: number, newDistance: number): void {
    const stepIndex = stepNumber - 1;
    if (stepIndex < 0 || stepIndex >= this.state.steps.length) {
      throw new Error(`Step ${stepNumber} not found`);
    }

    const step = this.state.steps[stepIndex];
    // Update the step
    step.measurement.distance = newDistance;

    // Recalculate all subsequent points
    for (let i = stepIndex; i < this.state.steps.length; i++) {
      const currentStep = this.state.steps[i];
      const prevPoint = i === 0 ? this.state.startPoint : this.state.points[i];
      const radians = (currentStep.bearing * Math.PI) / 180;
      const nextPoint = {
        x: prevPoint.x + currentStep.measurement.distance * Math.cos(radians),
        y: prevPoint.y + currentStep.measurement.distance * Math.sin(radians),
      };
      this.state.points[i + 1] = nextPoint;
      currentStep.endPoint = nextPoint;
    }
  }

  /**
   * Manually close the polygon
   * Creates closing segment from last point back to first
   */
  autoClose(): void {
    if (!this.state.isActive || this.state.points.length < 3) {
      return;
    }

    const closingDistance = this.distance(
      this.state.points[this.state.points.length - 1],
      this.state.points[0],
    );
    const closingBearing = this.bearing(
      this.state.points[this.state.points.length - 1],
      this.state.points[0],
    );

    // Final segment: last point back to first
    this.state.segments.push({
      from: this.state.points.length - 1,
      to: 0,
      distance: closingDistance,
      bearing: closingBearing,
    });

    this.state.isActive = false; // Walk complete
  }

  /**
   * Export as GeometryData
   */
  exportGeometry(): GeometryData {
    // Return a valid GeometryData object
    const perimeter = this.state.steps.reduce(
      (sum, s) => sum + s.measurement.distance,
      0,
    );
    const area = this.computeArea();
    // Map points to GeometryData.Point
    const points = this.state.points.map((p, i) => ({
      id: `pt-${i}`,
      x: p.x,
      y: p.y,
      timestamp: Date.now(),
    }));
    // Map segments to GeometryData.Segment
    const segments = this.state.segments.map((s, i) => ({
      id: `seg-${i}`,
      p1Id: `pt-${s.from}`,
      p2Id: `pt-${s.to}`,
      type: "wall" as const,
      length: s.distance,
      timestamp: Date.now(),
    }));
    return {
      id: crypto.randomUUID(),
      roomId: "walk-room", // placeholder, should be set by caller
      jobId: "walk-job", // placeholder, should be set by caller
      workspaceId: "walk-workspace", // placeholder, should be set by caller
      points,
      segments,
      labels: [],
      layers: [],
      constraints: [],
      mode: "points",
      closedPolygon: true,
      perimeter,
      area,
      version: 1,
      updatedAt: Date.now(),
      updatedBy: "walk-the-room",
    };
  }

  /**
   * Get current state (for UI)
   */
  getState(): WalkTheRoomState {
    return { ...this.state };
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private distance(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private bearing(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  }

  private computeArea(): number {
    // Shoelace formula
    let area = 0;
    for (let i = 0; i < this.state.points.length; i++) {
      const p1 = this.state.points[i];
      const p2 = this.state.points[(i + 1) % this.state.points.length];
      area += p1.x * p2.y;
      area -= p2.x * p1.y;
    }
    return Math.abs(area) / 2;
  }
}

// ============================================================================
// iPhone UI Component for Walk-the-Room
// ============================================================================

/**
 * React component for walk-the-room workflow
 *
 * Usage:
 *   <WalkTheRoomUI
 *     onComplete={(geometry) => saveToFirestore(geometry)}
 *   />
 */

import React, { useEffect, useState } from "react";

import type { GeometryData } from "@/lib/geometrySchema";

export interface WalkTheRoomUIProps {
  onComplete?: (geometry: GeometryData) => void;
  onCancel?: () => void;
}

export function WalkTheRoomUI({ onComplete, onCancel }: WalkTheRoomUIProps) {
  const [engine] = useState(() => new WalkTheRoomEngine());
  const [state, setState] = useState<WalkTheRoomState>(engine.getState());
  const [leiacDistance, setLeiacDistance] = useState("");
  const [leiacBearing, setLeiacBearing] = useState("");

  useEffect(() => {
    engine.start();
    setState(engine.getState());
  }, [engine]);

  const handleAddMeasurement = () => {
    try {
      const distance = parseFloat(leiacDistance);
      const bearing = leiacBearing ? parseFloat(leiacBearing) : undefined;

      if (isNaN(distance) || distance <= 0) {
        alert("Enter valid distance");
        return;
      }

      engine.recordMeasurement(distance, bearing);
      setState(engine.getState());
      setLeiacDistance("");
      setLeiacBearing("");
    } catch (err) {
      console.error("Error adding measurement", err);
    }
  };

  const handleAutoClose = () => {
    engine.autoClose();
    setState(engine.getState());
    if (onComplete) {
      onComplete(engine.exportGeometry());
    }
  };

  const exported = engine.exportGeometry();

  return (
    <div className="flex flex-col h-screen bg-background text-slate-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-blue-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Walk the Room</h2>
        <p className="text-xs text-muted">
          {state.steps.length} walls • {exported.perimeter.toFixed(1)} ft
          perimeter • {exported.area.toFixed(0)} sqft
        </p>
      </div>

      {/* Diagram */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <WalkTheRoomDiagram points={exported.points} steps={state.steps} />
      </div>

      {/* Measurement Input */}
      <div className="border-t border-gray-200 bg-background text-slate-900 px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-muted">
          Step {state.steps.length + 1}
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            value={leiacDistance}
            onChange={(e) => setLeiacDistance(e.target.value)}
            placeholder="Distance (ft)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            step="0.5"
          />
          <input
            type="number"
            value={leiacBearing}
            onChange={(e) => setLeiacBearing(e.target.value)}
            placeholder="Bearing (°)"
            className="w-20 px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <button
          onClick={handleAddMeasurement}
          className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded"
        >
          + Add Wall
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-background border border-gray-300 text-gray-700 text-sm font-semibold rounded"
        >
          Cancel
        </button>
        {state.steps.length >= 3 && (
          <button
            onClick={handleAutoClose}
            className="flex-1 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded"
          >
            ✓ Save Room
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Diagram showing walked perimeter
 */

function WalkTheRoomDiagram({
  points,
  steps,
}: {
  points: Array<{ x: number; y: number }>;
  steps: WalkStep[];
}) {
  const canvas = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!canvas.current) return;

    const ctx = canvas.current.getContext("2d");
    if (!ctx) return;

    const SCALE = 20; // pixels per foot
    const MARGIN = 20;

    // Clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);

    // Draw polygon
    ctx.strokeStyle = "#4A90E2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = MARGIN + p.x * SCALE;
      const y = MARGIN + p.y * SCALE;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    // Draw points
    points.forEach((p, i) => {
      const x = MARGIN + p.x * SCALE;
      const y = MARGIN + p.y * SCALE;
      ctx.fillStyle = i === 0 ? "#FF6B6B" : "#4A90E2";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = "#000000";
      ctx.font = "10px sans-serif";
      ctx.fillText(`${i + 1}`, x + 6, y - 6);
    });

    // Draw measurements
    steps.forEach((step) => {
      const midX = MARGIN + ((step.startPoint.x + step.endPoint.x) / 2) * SCALE;
      const midY = MARGIN + ((step.startPoint.y + step.endPoint.y) / 2) * SCALE;
      ctx.fillStyle = "#FF9E64";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`${step.measurement.distance.toFixed(1)}'`, midX, midY);
    });
  }, [points, steps]);

  return (
    <canvas
      ref={canvas}
      width={340}
      height={400}
      className="w-full border border-gray-200 rounded-lg bg-background text-slate-900"
    />
  );
}

/**
 * Export for use in iPhone app
 */
