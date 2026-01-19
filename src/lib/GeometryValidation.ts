/**
 * GeometryValidation.ts - Business rules for geometry integrity
 * 
 * Enforces:
 * - Minimum perimeter (20 feet for valid room)
 * - No self-intersecting walls (manifold check)
 * - No isolated points
 * - Sensible area bounds
 * - Segment length constraints
 * - Polygon closure validation
 */

import {
  Point,
  Segment,
  GeometryData,
  ValidationError,
  GEOMETRY_DEFAULTS,
} from "@/lib/geometrySchema";

/**
 * GeometryValidator - Batch validation of geometry
 */
export class GeometryValidator {
  /**
   * Full validation pass: run all checks
   */
  static validate(geometry: GeometryData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Collection validation
    errors.push(...this.validatePointCollection(geometry));
    errors.push(...this.validateSegmentCollection(geometry));
    errors.push(...this.validateTopology(geometry));
    errors.push(...this.validatePolygonProperties(geometry));

    return errors;
  }

  /**
   * Validate individual point addition
   * Called when user attempts to place a point
   */
  static validatePointPlacement(
    x: number,
    y: number,
    geometry: GeometryData,
  ): ValidationError | null {
    // Check: Point already exists at this location (within grid snap)
    const GRID_SIZE = GEOMETRY_DEFAULTS.GRID_SIZE;
    for (const existing of geometry.points) {
      if (
        Math.abs(existing.x - x) < GRID_SIZE / 2 &&
        Math.abs(existing.y - y) < GRID_SIZE / 2
      ) {
        return {
          code: "duplicate_point",
          severity: "warning",
          message: `Point already exists at (${x.toFixed(1)}, ${y.toFixed(1)})`,
        };
      }
    }

    // All checks passed
    return null;
  }

  /**
   * Validate segment connection
   * Called when user attempts to create a segment
   */
  static validateSegmentCreation(
    p1Id: string,
    p2Id: string,
    geometry: GeometryData,
  ): ValidationError | null {
    // Check: Points exist
    const p1 = geometry.points.find((p) => p.id === p1Id);
    const p2 = geometry.points.find((p) => p.id === p2Id);

    if (!p1 || !p2) {
      return {
        code: "point_not_found",
        severity: "error",
        message: "One or both points do not exist",
        affectedIds: [p1Id, p2Id].filter((id) => !geometry.points.find((p) => p.id === id)),
      };
    }

    // Check: Same point
    if (p1Id === p2Id) {
      return {
        code: "self_connection",
        severity: "error",
        message: "Cannot connect a point to itself",
        affectedIds: [p1Id],
      };
    }

    // Check: Segment already exists
    for (const seg of geometry.segments) {
      if ((seg.p1Id === p1Id && seg.p2Id === p2Id) || (seg.p1Id === p2Id && seg.p2Id === p1Id)) {
        return {
          code: "segment_exists",
          severity: "warning",
          message: "Segment between these points already exists",
          affectedIds: [p1Id, p2Id],
        };
      }
    }

    // Check: Segment length
    const length = this.distance(p1, p2);
    if (length < GEOMETRY_DEFAULTS.MINIMUM_SEGMENT_LENGTH) {
      return {
        code: "segment_too_short",
        severity: "error",
        message: `Segment length (${length.toFixed(2)} ft) below minimum ${GEOMETRY_DEFAULTS.MINIMUM_SEGMENT_LENGTH} ft`,
        affectedIds: [p1Id, p2Id],
      };
    }

    // Check: Would create self-intersection
    const newSegment: Segment = {
      id: "temp",
      p1Id,
      p2Id,
      type: "wall",
      timestamp: Date.now(),
    };

    for (const existing of geometry.segments) {
      // Skip if they share an endpoint
      if ([newSegment.p1Id, newSegment.p2Id].includes(existing.p1Id) ||
          [newSegment.p1Id, newSegment.p2Id].includes(existing.p2Id)) {
        continue;
      }

      if (this.segmentsIntersect(newSegment, existing, geometry)) {
        return {
          code: "self_intersecting",
          severity: "error",
          message: "Segment would intersect with existing wall",
          affectedIds: [newSegment.id, existing.id],
        };
      }
    }

    return null;
  }

  /**
   * Validate polygon closure
   * Called when user tries to close polygon
   */
  static validatePolygonClosure(geometry: GeometryData): ValidationError | null {
    if (geometry.points.length < 3) {
      return {
        code: "insufficient_points",
        severity: "error",
        message: `Polygon needs at least 3 points, have ${geometry.points.length}`,
      };
    }

    const perimeter = geometry.segments.reduce((sum, seg) => sum + (seg.length ?? 0), 0);

    if (perimeter < GEOMETRY_DEFAULTS.MINIMUM_PERIMETER) {
      return {
        code: "perimeter_too_small",
        severity: "error",
        message: `Perimeter (${perimeter.toFixed(1)} ft) is less than minimum ${GEOMETRY_DEFAULTS.MINIMUM_PERIMETER} ft`,
      };
    }

    return null;
  }

  // ===== Private validation methods =====

  private static validatePointCollection(geometry: GeometryData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check: Duplicate points
    const seen = new Set<string>();
    for (const point of geometry.points) {
      const key = `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      if (seen.has(key)) {
        errors.push({
          code: "duplicate_points",
          severity: "warning",
          message: "Multiple points at same location",
          affectedIds: geometry.points
            .filter((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}` === key)
            .map((p) => p.id),
        });
      }
      seen.add(key);
    }

    // Check: Isolated points (points with no segments)
    const pointsWithSegments = new Set<string>();
    for (const seg of geometry.segments) {
      pointsWithSegments.add(seg.p1Id);
      pointsWithSegments.add(seg.p2Id);
    }

    const isolated = geometry.points.filter((p) => !pointsWithSegments.has(p.id));
    if (isolated.length > 0 && geometry.closedPolygon) {
      errors.push({
        code: "isolated_points",
        severity: "warning",
        message: `${isolated.length} point(s) not connected to polygon`,
        affectedIds: isolated.map((p) => p.id),
      });
    }

    return errors;
  }

  private static validateSegmentCollection(geometry: GeometryData): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const segment of geometry.segments) {
      const p1 = geometry.points.find((p) => p.id === segment.p1Id);
      const p2 = geometry.points.find((p) => p.id === segment.p2Id);

      // Check: Both points exist
      if (!p1 || !p2) {
        errors.push({
          code: "orphaned_segment",
          severity: "error",
          message: "Segment references non-existent point",
          affectedIds: [segment.id],
        });
        continue;
      }

      // Check: Segment length is valid
      const length = this.distance(p1, p2);
      if (length < GEOMETRY_DEFAULTS.MINIMUM_SEGMENT_LENGTH) {
        errors.push({
          code: "segment_too_short",
          severity: "error",
          message: `Segment ${segment.id} too short (${length.toFixed(2)} ft)`,
          affectedIds: [segment.id],
        });
      }
    }

    return errors;
  }

  private static validateTopology(geometry: GeometryData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check: Self-intersecting segments
    for (let i = 0; i < geometry.segments.length; i++) {
      for (let j = i + 1; j < geometry.segments.length; j++) {
        const seg1 = geometry.segments[i];
        const seg2 = geometry.segments[j];

        // Skip if they share endpoints
        if ([seg1.p1Id, seg1.p2Id].includes(seg2.p1Id) ||
            [seg1.p1Id, seg1.p2Id].includes(seg2.p2Id)) {
          continue;
        }

        if (this.segmentsIntersect(seg1, seg2, geometry)) {
          errors.push({
            code: "self_intersecting_walls",
            severity: "error",
            message: "Walls intersect (invalid polygon)",
            affectedIds: [seg1.id, seg2.id],
          });
        }
      }
    }

    // Check: Polygon closure consistency
    if (geometry.closedPolygon) {
      // If polygon is marked closed, verify it's actually closed
      const orderedPoints = this.orderPolygonPoints(geometry);
      if (orderedPoints.length < 3) {
        errors.push({
          code: "invalid_polygon_closure",
          severity: "error",
          message: "Polygon marked closed but has < 3 ordered points",
        });
      }
    }

    return errors;
  }

  private static validatePolygonProperties(geometry: GeometryData): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!geometry.closedPolygon || geometry.points.length < 3) {
      return errors; // Skip if not closed
    }

    const perimeter = geometry.segments.reduce((sum, seg) => sum + (seg.length ?? 0), 0);
    const area = this.computeArea(geometry);

    // Check: Minimum perimeter
    if (perimeter < GEOMETRY_DEFAULTS.MINIMUM_PERIMETER) {
      errors.push({
        code: "perimeter_too_small",
        severity: "error",
        message: `Perimeter (${perimeter.toFixed(1)} ft) is less than minimum ${GEOMETRY_DEFAULTS.MINIMUM_PERIMETER} ft`,
      });
    }

    // Check: Maximum area
    if (area > GEOMETRY_DEFAULTS.MAXIMUM_AREA) {
      errors.push({
        code: "area_too_large",
        severity: "warning",
        message: `Area (${area.toFixed(0)} sqft) exceeds typical room size`,
      });
    }

    return errors;
  }

  // ===== Geometric helpers =====

  private static distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private static segmentsIntersect(
    seg1: Segment,
    seg2: Segment,
    geometry: GeometryData,
  ): boolean {
    const p1 = geometry.points.find((p) => p.id === seg1.p1Id);
    const p2 = geometry.points.find((p) => p.id === seg1.p2Id);
    const p3 = geometry.points.find((p) => p.id === seg2.p1Id);
    const p4 = geometry.points.find((p) => p.id === seg2.p2Id);

    if (!p1 || !p2 || !p3 || !p4) return false;

    // Use CCW (counter-clockwise) method
    const ccw = (a: Point, b: Point, c: Point) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }

  private static computeArea(geometry: GeometryData): number {
    const orderedPoints = this.orderPolygonPoints(geometry);
    if (orderedPoints.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < orderedPoints.length; i++) {
      const p1 = orderedPoints[i];
      const p2 = orderedPoints[(i + 1) % orderedPoints.length];
      area += p1.x * p2.y;
      area -= p2.x * p1.y;
    }

    return Math.abs(area) / 2.0;
  }

  private static orderPolygonPoints(geometry: GeometryData): Point[] {
    if (geometry.points.length < 3) return geometry.points;

    // Compute centroid
    const cx = geometry.points.reduce((sum, p) => sum + p.x, 0) / geometry.points.length;
    const cy = geometry.points.reduce((sum, p) => sum + p.y, 0) / geometry.points.length;

    // Sort by angle from centroid
    return [...geometry.points].sort((a, b) => {
      const angleA = Math.atan2(a.y - cy, a.x - cx);
      const angleB = Math.atan2(b.y - cy, b.x - cx);
      return angleA - angleB;
    });
  }
}

/**
 * Example: Using GeometryValidator in a form handler
 * 
 * ```tsx
 * import { GeometryValidator } from "@/lib/GeometryValidation";
 * 
 * async function handleAddPoint(geometry: GeometryData, x: number, y: number) {
 *   // Check if placement is valid
 *   const error = GeometryValidator.validatePointPlacement(x, y, geometry);
 *   if (error) {
 *     toast.warning(error.message);
 *     return;
 *   }
 * 
 *   // Add point via engine
 *   const engine = new GeometryEngine(geometry);
 *   const point = await engine.addPoint(x, y, snapRules);
 * 
 *   // Validate entire geometry after change
 *   const errors = GeometryValidator.validate(engine.geometry);
 *   if (errors.some(e => e.severity === "error")) {
 *     toast.error("Geometry validation failed");
 *     return;
 *   }
 * 
 *   setGeometry(engine.geometry);
 * }
 * ```
 */
