/**
 * Geometry Schema - Type-safe model for room layouts, measurements, and constraints
 * 
 * This is the intellectual core that unifies:
 * - Web canvas rendering (next/canvas)
 * - iOS drawing engine (SwiftUI CoreGraphics)
 * - Firestore persistence (geometry JSON)
 * - PDF floor plan generation
 * - Measurement capture (laser, Square Measure, manual)
 */

/**
 * Point - Represents a vertex in the room layout
 * Units: feet (standard flooring measurement)
 */
export interface Point {
  id: string; // UUID
  x: number; // feet from origin
  y: number; // feet from origin
  z?: number; // elevation (optional, for split-level)
  label?: string; // room corner name (NW, NE, etc.)
  timestamp: number; // creation time
}

/**
 * Segment - A wall or edge connecting two points
 */
export interface Segment {
  id: string; // UUID
  p1Id: string; // reference to Point.id
  p2Id: string; // reference to Point.id
  type: "wall" | "door" | "window" | "opening" | "reference-line";
  length?: number; // computed in feet, cached for fast lookup
  angle?: number; // degrees from horizontal (0-359)
  material?: string; // flooring type (carpet, LVP, tile, etc.)
  notes?: string;
  timestamp: number;
}

/**
 * Label - Text annotation on the geometry
 * Examples: "24' wall", "pocket door", "built-in shelf"
 */
export interface Label {
  id: string;
  text: string;
  x: number; // feet
  y: number; // feet
  angle?: number; // rotation in degrees
  fontSize?: number; // points
  timestamp: number;
}

/**
 * Constraint - Rules applied to points/segments
 * Used by SnapRules engine to enforce alignment
 */
export interface Constraint {
  id: string;
  type: "grid-snap" | "angle-assist" | "wall-lock" | "magnetic-edge" | "perpendicular";
  targetId: string; // Point or Segment ID
  metadata?: Record<string, unknown>; // grid size, threshold, etc.
}

/**
 * Layer - Organizationalstructure for different material types
 * Allows users to separate flooring types, transitions, baseboards, etc.
 */
export interface Layer {
  id: string;
  name: string; // "Flooring", "Demo", "Baseboards", "Transitions", "Notes"
  visible: boolean;
  locked: boolean;
  opacity?: number; // 0-1
  color?: string; // hex code for layer visualization
  pointIds: string[]; // points on this layer
  segmentIds: string[]; // segments on this layer
}

/**
 * GeometryOperation - Transaction for undo/redo
 * Immutable snapshot of a change
 */
export type GeometryOperation =
  | { type: "add-point"; point: Point }
  | { type: "remove-point"; pointId: string }
  | { type: "move-point"; pointId: string; oldX: number; oldY: number; newX: number; newY: number }
  | { type: "add-segment"; segment: Segment }
  | { type: "remove-segment"; segmentId: string }
  | { type: "set-label"; label: Label }
  | { type: "remove-label"; labelId: string }
  | { type: "add-constraint"; constraint: Constraint }
  | { type: "batch"; ops: GeometryOperation[] };

/**
 * UndoFrame - Immutable snapshot for undo/redo stack
 */
export interface UndoFrame {
  id: string;
  timestamp: number;
  operation: GeometryOperation;
  description: string; // human-readable: "Add point", "Close polygon", etc.
}

/**
 * ValidationError - Result of geometry validation
 */
export interface ValidationError {
  code: string;
  severity: "error" | "warning";
  message: string;
  affectedIds?: string[]; // Point/Segment IDs that failed validation
}

/**
 * GeometryData - Complete room geometry snapshot
 * Stored in Firestore and GRDB, exported to PDF/measurements
 */
export interface GeometryData {
  // Identity
  id: string;
  roomId: string;
  jobId: string;
  workspaceId: string;

  // Content
  points: Point[];
  segments: Segment[];
  labels: Label[];
  layers: Layer[];
  constraints: Constraint[];

  // Geometry metadata
  mode: "points" | "sketch" | "laser-legacy"; // capture method
  closedPolygon: boolean; // true if points form a closed loop
  perimeter: number; // feet, computed from segments
  area: number; // square feet, computed from polygon

  // Versioning & sync
  version: number; // incremented on each change
  updatedAt: number; // timestamp
  updatedBy: string; // user ID or device identifier
  deviceOrientation?: "portrait" | "landscape"; // iPad orientation when created

  // Optional metadata
  tags?: string[];
  notes?: string;
  archived?: boolean;
}

/**
 * ComputedGeometry - Derived values computed by the geometry engine
 * Read-only, regenerated on each geometry change
 */
export interface ComputedGeometry {
  perimeter: number; // feet
  area: number; // square feet
  validationErrors: ValidationError[];
  isClosed: boolean;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  centroid: { x: number; y: number }; // center of mass for labeling
}

/**
 * SnapResult - Output from SnapRules evaluation
 * Tells the geometry engine where to actually place a point
 */
export interface SnapResult {
  x: number;
  y: number;
  snappedTo?: "grid" | "angle" | "wall" | "edge"; // what it snapped to
  distance: number; // pixels from original touch point
}

/**
 * GeometryExport - Format for syncing to Firestore/GRDB
 */
export interface GeometryExport {
  geometry: GeometryData;
  computed: ComputedGeometry;
  exportedAt: number;
  format: "json";
}

/**
 * Constants for geometry engine
 */
export const GEOMETRY_DEFAULTS = {
  // Snap thresholds
  GRID_SIZE: 0.5, // 6 inches in feet
  SNAP_THRESHOLD_PIXELS: 24,
  MAGNETIC_EDGE_RADIUS: 12, // feet from wall to trigger snap

  // Validation
  MINIMUM_PERIMETER: 20, // feet
  MINIMUM_SEGMENT_LENGTH: 1, // feet
  MAXIMUM_AREA: 10000, // square feet (reasonable room cap)

  // Canvas/rendering
  PIXELS_PER_FOOT: 40, // for iPad display scaling
  POINT_RADIUS_PIXELS: 8,
  LABEL_FONT_SIZE: 12, // points

  // Layers
  DEFAULT_LAYERS: [
    { name: "Flooring", color: "#59F2C2" },
    { name: "Demo", color: "#76A1FF" },
    { name: "Baseboards", color: "#FF9E64" },
    { name: "Transitions", color: "#C4B5FD" },
    { name: "Notes", color: "#A0AEC0" },
  ],

  // Undo/redo
  MAX_UNDO_FRAMES: 50,
};

/**
 * Helper to create blank GeometryData
 */
export function createBlankGeometry(
  roomId: string,
  jobId: string,
  workspaceId: string,
  mode: "points" | "sketch" | "laser-legacy" = "points",
): GeometryData {
  return {
    id: crypto.randomUUID(),
    roomId,
    jobId,
    workspaceId,
    points: [],
    segments: [],
    labels: [],
    layers: GEOMETRY_DEFAULTS.DEFAULT_LAYERS.map((l) => ({
      id: crypto.randomUUID(),
      name: l.name,
      visible: true,
      locked: false,
      color: l.color,
      pointIds: [],
      segmentIds: [],
    })),
    constraints: [],
    mode,
    closedPolygon: false,
    perimeter: 0,
    area: 0,
    version: 0,
    updatedAt: Date.now(),
    updatedBy: "system",
  };
}
