/**
 * GeometryEngine - TypeScript stub
 * 
 * TODO: Implement full engine (currently in Swift for iOS)
 * This stub allows components to compile and run with placeholder behavior.
 * In production, this will be replaced with:
 * - Swift implementation (iOS native app)
 * - Web implementation (if needed for web platform)
 */

import type { GeometryData, Point, Segment, ComputedGeometry } from "@/lib/geometrySchema";


export class GeometryEngine {
  private geometryData: GeometryData;
  public undoStack: GeometryData[] = [];
  public redoStack: GeometryData[] = [];

  constructor(initialGeometry: GeometryData) {
    this.geometryData = { ...initialGeometry };
  }

  get geometry(): GeometryData {
    return this.geometryData;
  }

  addPoint(x: number, y: number): Point {
    const point: Point = {
      id: crypto.randomUUID(),
      x,
      y,
      timestamp: Date.now(),
    };

    this.geometryData.points.push(point);
    return point;
  }

  movePoint(pointId: string, x: number, y: number): void {
    const point = this.geometryData.points.find((p) => p.id === pointId);
    if (point) {
      point.x = x;
      point.y = y;
    }
  }

  removePoint(pointId: string): void {
    this.geometryData.points = this.geometryData.points.filter((p) => p.id !== pointId);
    this.geometryData.segments = this.geometryData.segments.filter(
      (s) => s.p1Id !== pointId && s.p2Id !== pointId
    );
  }

  addSegment(p1Id: string, p2Id: string, type: "wall" | "door" | "window" | "opening" | "reference-line" = "wall"): Segment {
    const segment: Segment = {
      id: crypto.randomUUID(),
      p1Id,
      p2Id,
      type,
      timestamp: Date.now(),
    };

    this.geometryData.segments.push(segment);
    return segment;
  }

  removeSegment(segmentId: string): void {
    this.geometryData.segments = this.geometryData.segments.filter((s) => s.id !== segmentId);
  }

  closePolygon(): void {
    if (this.geometryData.points.length < 3) {
      throw new Error("Need at least 3 points to close polygon");
    }

    const firstPoint = this.geometryData.points[0];
    const lastPoint = this.geometryData.points[this.geometryData.points.length - 1];

    if (firstPoint.id !== lastPoint.id) {
      this.addSegment(lastPoint.id, firstPoint.id, "wall");
    }

    this.geometryData.closedPolygon = true;
  }

  computePerimeter(): number {
    let perimeter = 0;
    for (const segment of this.geometryData.segments) {
      const p1 = this.geometryData.points.find((p) => p.id === segment.p1Id);
      const p2 = this.geometryData.points.find((p) => p.id === segment.p2Id);
      if (p1 && p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        perimeter += Math.sqrt(dx * dx + dy * dy);
      }
    }
    return perimeter;
  }

  computeArea(): number {
    // Shoelace formula
    if (this.geometryData.points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < this.geometryData.points.length; i++) {
      const p1 = this.geometryData.points[i];
      const p2 = this.geometryData.points[(i + 1) % this.geometryData.points.length];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area) / 2;
  }

  exportComputed(): ComputedGeometry {
    return {
      perimeter: this.computePerimeter(),
      area: this.computeArea(),
      isClosed: this.geometryData.closedPolygon,
      validationErrors: [],
      bounds: {
        minX: Math.min(...this.geometryData.points.map((p) => p.x)),
        maxX: Math.max(...this.geometryData.points.map((p) => p.x)),
        minY: Math.min(...this.geometryData.points.map((p) => p.y)),
        maxY: Math.max(...this.geometryData.points.map((p) => p.y)),
      },
      centroid: {
        x: this.geometryData.points.reduce((sum, p) => sum + p.x, 0) / this.geometryData.points.length,
        y: this.geometryData.points.reduce((sum, p) => sum + p.y, 0) / this.geometryData.points.length,
      },
    };
  }

  undo(): void {
    if (this.undoStack.length === 0) {
      throw new Error("Nothing to undo");
    }

    this.redoStack.push(this.geometryData);
    this.geometryData = this.undoStack.pop()!;
  }

  redo(): void {
    if (this.redoStack.length === 0) {
      throw new Error("Nothing to redo");
    }

    this.undoStack.push(this.geometryData);
    this.geometryData = this.redoStack.pop()!;
  }
}
