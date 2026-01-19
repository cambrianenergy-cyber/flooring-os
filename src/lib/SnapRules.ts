/**
 * SnapRules.ts - Behavioral rules engine for point snapping
 * 
 * Determines where a touch point actually gets placed by evaluating:
 * 1. Grid snapping (6-inch grid)
 * 2. Angle assist (0°/45°/90° alignment)
 * 3. Wall lock (snap to existing segments)
 * 4. Magnetic edges (pull toward nearby walls)
 * 
 * Priority: Wall-lock > Magnetic edge > Angle-assist > Grid-snap
 */

import { Point, GeometryData, SnapResult, GEOMETRY_DEFAULTS } from "@/lib/geometrySchema";

/**
 * SnapRulesEngine - Evaluates where a point should snap
 */
export class SnapRulesEngine {
  private gridSize: number;
  private snapThresholdPixels: number;
  private magneticEdgeRadius: number;
  private pixelsPerFoot: number;

  constructor(
    gridSize: number = GEOMETRY_DEFAULTS.GRID_SIZE, // 6 inches
    snapThresholdPixels: number = GEOMETRY_DEFAULTS.SNAP_THRESHOLD_PIXELS, // 24px
    magneticEdgeRadius: number = GEOMETRY_DEFAULTS.MAGNETIC_EDGE_RADIUS, // 12 feet
    pixelsPerFoot: number = GEOMETRY_DEFAULTS.PIXELS_PER_FOOT, // 40px/ft
  ) {
    this.gridSize = gridSize;
    this.snapThresholdPixels = snapThresholdPixels;
    this.magneticEdgeRadius = magneticEdgeRadius;
    this.pixelsPerFoot = pixelsPerFoot;
  }

  /**
   * Main entry point: evaluate where touch should snap
   * Returns the final (x, y) coordinates and what it snapped to
   */
  evaluate(x: number, y: number, geometry: GeometryData): SnapResult {
    // Priority 1: Wall lock (snap to existing segments)
    const wallLockResult = this.evaluateWallLock(x, y, geometry);
    if (wallLockResult) {
      return {
        x: wallLockResult.x,
        y: wallLockResult.y,
        snappedTo: "wall",
        distance: this.pixelDistance(x, y, wallLockResult.x, wallLockResult.y),
      };
    }

    // Priority 2: Magnetic edge (pull toward nearby walls)
    const magneticResult = this.evaluateMagneticEdge(x, y, geometry);
    if (magneticResult) {
      return {
        x: magneticResult.x,
        y: magneticResult.y,
        snappedTo: "edge",
        distance: this.pixelDistance(x, y, magneticResult.x, magneticResult.y),
      };
    }

    // Priority 3: Angle assist (lock to 0°/45°/90° from last point)
    const angleResult = this.evaluateAngleAssist(x, y, geometry);
    if (angleResult) {
      return {
        x: angleResult.x,
        y: angleResult.y,
        snappedTo: "angle",
        distance: this.pixelDistance(x, y, angleResult.x, angleResult.y),
      };
    }

    // Priority 4: Grid snap (quantize to nearest grid cell)
    const gridResult = this.evaluateGridSnap(x, y);
    return {
      x: gridResult.x,
      y: gridResult.y,
      snappedTo: "grid",
      distance: this.pixelDistance(x, y, gridResult.x, gridResult.y),
    };
  }

  /**
   * Wall lock: Find closest point on any existing segment
   * If within snap threshold (in pixels), snap to that point
   */
  private evaluateWallLock(x: number, y: number, geometry: GeometryData): SnapResult | null {
    let closest: SnapResult | null = null;
    let closestDistance = this.snapThresholdPixels;

    for (const segment of geometry.segments) {
      const p1 = geometry.points.find((p) => p.id === segment.p1Id);
      const p2 = geometry.points.find((p) => p.id === segment.p2Id);

      if (!p1 || !p2) continue;

      // Find closest point on line segment
      const projection = this.projectPointOnSegment(x, y, p1, p2);
      const distance = this.pixelDistance(x, y, projection.x, projection.y);

      if (distance < closestDistance) {
        closest = projection;
        closestDistance = distance;
      }
    }

    return closest;
  }

  /**
   * Magnetic edge: If near a segment, pull toward it
   * Radius: 12 feet from wall
   */
  private evaluateMagneticEdge(x: number, y: number, geometry: GeometryData): SnapResult | null {
    let closest: SnapResult | null = null;
    let closestDistance = this.magneticEdgeRadius;

    for (const segment of geometry.segments) {
      const p1 = geometry.points.find((p) => p.id === segment.p1Id);
      const p2 = geometry.points.find((p) => p.id === segment.p2Id);

      if (!p1 || !p2) continue;

      const projection = this.projectPointOnSegment(x, y, p1, p2);
      const feetDistance = this.footDistance(x, y, projection.x, projection.y);

      if (feetDistance < closestDistance) {
        closest = projection;
        closestDistance = feetDistance;
      }
    }

    return closest ? { ...closest, distance: closestDistance } : null;
  }

  /**
   * Angle assist: Lock new point to 0°/90°/45° from last point
   * Only applies if there's a previous point
   */
  private evaluateAngleAssist(x: number, y: number, geometry: GeometryData): SnapResult | null {
    if (geometry.points.length === 0) return null;

    const lastPoint = geometry.points[geometry.points.length - 1];
    const dx = x - lastPoint.x;
    const dy = y - lastPoint.y;

    // Current angle from last point
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // Target angles (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
    const targets = [0, 45, 90, 135, 180, 225, 270, 315];
    const tolerance = 5; // degrees

    let closestAngle: number | null = null;
    let minDiff = tolerance;

    for (const target of targets) {
      let diff = Math.abs(angle - target);
      if (diff > 180) diff = 360 - diff;

      if (diff < minDiff) {
        closestAngle = target;
        minDiff = diff;
      }
    }

    if (closestAngle === null) return null;

    // Project point onto line at target angle
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radians = (closestAngle * Math.PI) / 180;
    const snappedX = lastPoint.x + Math.cos(radians) * distance;
    const snappedY = lastPoint.y + Math.sin(radians) * distance;

    const pixelDist = this.pixelDistance(x, y, snappedX, snappedY);
    
    // Only snap if close enough
    if (pixelDist < this.snapThresholdPixels) {
      return {
        x: snappedX,
        y: snappedY,
        snappedTo: "angle",
        distance: pixelDist,
      };
    }

    return null;
  }

  /**
   * Grid snap: Quantize to nearest grid cell
   * Grid size: 6 inches (0.5 feet)
   */
  private evaluateGridSnap(x: number, y: number): SnapResult {
    const snappedX = Math.round(x / this.gridSize) * this.gridSize;
    const snappedY = Math.round(y / this.gridSize) * this.gridSize;

    return {
      x: snappedX,
      y: snappedY,
      snappedTo: "grid",
      distance: this.footDistance(x, y, snappedX, snappedY),
    };
  }

  /**
   * Helper: Project point P onto line segment AB
   * Returns the closest point on the segment
   */
  private projectPointOnSegment(
    px: number,
    py: number,
    a: Point,
    b: Point,
  ): SnapResult {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return { x: a.x, y: a.y, snappedTo: "wall", distance: 0 };
    }

    // Parameter t of projection (clamped to [0, 1] for segment)
    let t = ((px - a.x) * dx + (py - a.y) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = a.x + t * dx;
    const closestY = a.y + t * dy;

    return {
      x: closestX,
      y: closestY,
      snappedTo: "wall",
      distance: 0,
    };
  }

  /**
   * Helper: Distance in pixels (screen space)
   * Used for snap threshold comparisons
   */
  private pixelDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = (x2 - x1) * this.pixelsPerFoot;
    const dy = (y2 - y1) * this.pixelsPerFoot;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Helper: Distance in feet (geometry space)
   */
  private footDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Configuration presets for different use cases
 */
export const SNAP_PRESETS = {
  /**
   * Precise mode: Strict snapping, narrow thresholds
   * Used: Professional measurements, exacting work
   */
  precise: {
    gridSize: 0.25, // 3 inches
    snapThresholdPixels: 16,
    magneticEdgeRadius: 6,
  },

  /**
   * Normal mode: Balanced snapping, standard thresholds
   * Used: Default, most workflows
   */
  normal: {
    gridSize: 0.5, // 6 inches
    snapThresholdPixels: 24,
    magneticEdgeRadius: 12,
  },

  /**
   * Loose mode: Forgiving snapping, wide thresholds
   * Used: Quick sketches, rough estimates
   */
  loose: {
    gridSize: 1.0, // 12 inches
    snapThresholdPixels: 36,
    magneticEdgeRadius: 18,
  },

  /**
   * No snap mode: Only grid quantization, no wall/angle/magnetic
   * Used: Free-form sketching, artistic layouts
   */
  noSnap: {
    gridSize: 0.5,
    snapThresholdPixels: 0, // Effectively disables wall/angle/magnetic
    magneticEdgeRadius: 0,
  },
};

/**
 * Example: Using SnapRulesEngine in a React component
 * 
 * ```tsx
 * import { SnapRulesEngine, SNAP_PRESETS } from "@/lib/SnapRules";
 * import { useCallback } from "react";
 * 
 * export function FloorPlanCanvas({ geometry, onAddPoint }) {
 *   const snapEngine = useCallback(
 *     (x: number, y: number) => {
 *       const engine = new SnapRulesEngine(
 *         SNAP_PRESETS.normal.gridSize,
 *         SNAP_PRESETS.normal.snapThresholdPixels,
 *         SNAP_PRESETS.normal.magneticEdgeRadius,
 *       );
 *       return engine.evaluate(x, y, geometry);
 *     },
 *     [geometry],
 *   );
 * 
 *   const handleCanvasClick = (e: React.MouseEvent) => {
 *     const rect = e.currentTarget.getBoundingClientRect();
 *     const screenX = e.clientX - rect.left;
 *     const screenY = e.clientY - rect.top;
 * 
 *     // Convert pixels to feet (assuming 40px = 1 foot)
 *     const feetX = screenX / 40;
 *     const feetY = screenY / 40;
 * 
 *     const snapped = snapEngine(feetX, feetY);
 *     onAddPoint(snapped.x, snapped.y, snapped.snappedTo);
 *   };
 * 
 *   return <canvas onClick={handleCanvasClick} />;
 * }
 * ```
 */
