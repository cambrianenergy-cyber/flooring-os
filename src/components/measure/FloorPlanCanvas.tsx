/**
 * Floor Plan Canvas Component
 *
 * Interactive canvas for drawing room geometries from laser measurements
 */

"use client";

import type {
    GeometryOpening,
    GeometryPoint,
    GeometrySegment,
    MeasureGeometry,
    MeasureReading,
} from "@/types/measureSchema";
import { MEASURE_COLLECTIONS } from "@/types/measureSchema";
import {
    addDoc,
    collection,
    doc,
    getFirestore,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { OpeningEditor } from "./OpeningEditor";
import { PhotoCapture } from "./PhotoCapture";

interface FloorPlanCanvasProps {
  workspaceId: string;
  jobId: string;
  roomId: string;
  sessionId: string;
  readings: (MeasureReading & { id: string })[];
  userId: string;
  onGeometryUpdated?: (geometry: MeasureGeometry & { id: string }) => void;
}

interface CanvasPoint extends GeometryPoint {
  screenX: number;
  screenY: number;
}

const PIXELS_PER_FOOT = 30; // Scale: 30 pixels = 1 foot
const GRID_SIZE = 12; // inches

export function FloorPlanCanvas({
  workspaceId,
  jobId,
  roomId,
  readings,
  userId,
  onGeometryUpdated,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [manualPoints, setManualPoints] = useState<CanvasPoint[]>([]);
  const [manualSegments, setManualSegments] = useState<GeometrySegment[]>([]);
  const [openings, setOpenings] = useState<GeometryOpening[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [geometryId, setGeometryId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const db = getFirestore();

  const buildGeometryFromReadings = useCallback(() => {
    const newPoints: CanvasPoint[] = [];
    const newSegments: GeometrySegment[] = [];

    let currentX = 300; // Start at center
    let currentY = 300;
    let currentAngle = 0; // 0 = right, 90 = up, 180 = left, 270 = down

    readings.forEach((reading, index) => {
      const distanceInches = reading.reading.value * 12;
      const radians = (currentAngle * Math.PI) / 180;
      const deltaX = distanceInches * Math.cos(radians);
      const deltaY = -distanceInches * Math.sin(radians); // Negative because canvas Y goes down

      const newX = currentX + deltaX;
      const newY = currentY + deltaY;

      const point: CanvasPoint = {
        id: `p${index + 1}`,
        x: currentX,
        y: currentY,
        locked: false,
        screenX: currentX,
        screenY: currentY,
      };

      newPoints.push(point);

      if (index > 0) {
        const segment: GeometrySegment = {
          id: `s${index}`,
          a: `p${index}`,
          b: `p${index + 1}`,
          length: distanceInches,
          source: "laser",
          readingId: reading.id,
        };
        newSegments.push(segment);
      }

      currentAngle = (currentAngle - 90) % 360;
      currentX = newX;
      currentY = newY;
    });

    if (newPoints.length >= 3) {
      const closingSegment: GeometrySegment = {
        id: `s${newPoints.length}`,
        a: `p${newPoints.length}`,
        b: "p1",
        length: Math.sqrt(
          Math.pow(newPoints[newPoints.length - 1].x - newPoints[0].x, 2) +
            Math.pow(newPoints[newPoints.length - 1].y - newPoints[0].y, 2),
        ),
        source: "derived",
        readingId: undefined,
      };
      newSegments.push(closingSegment);
    }

    return { points: newPoints, segments: newSegments };
  }, [readings]);

  const autoGeometry = useMemo(
    () => buildGeometryFromReadings(),
    [buildGeometryFromReadings],
  );

  const activePoints = manualMode ? manualPoints : autoGeometry.points;
  const activeSegments = manualMode ? manualSegments : autoGeometry.segments;

  const calculateArea = useCallback((): number => {
    if (activePoints.length < 3) return 0;

    let sum = 0;
    for (let i = 0; i < activePoints.length; i++) {
      const j = (i + 1) % activePoints.length;
      sum += activePoints[i].x * activePoints[j].y;
      sum -= activePoints[j].x * activePoints[i].y;
    }
    const areaSqInches = Math.abs(sum) / 2;
    return areaSqInches / 144; // Convert to square feet
  }, [activePoints]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += (GRID_SIZE * PIXELS_PER_FOOT) / 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (
      let y = 0;
      y < canvas.height;
      y += (GRID_SIZE * PIXELS_PER_FOOT) / 12
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    activeSegments.forEach((segment) => {
      const pointA = activePoints.find((p) => p.id === segment.a);
      const pointB = activePoints.find((p) => p.id === segment.b);
      if (!pointA || !pointB) return;

      ctx.beginPath();
      ctx.moveTo(pointA.screenX, pointA.screenY);
      ctx.lineTo(pointB.screenX, pointB.screenY);
      ctx.stroke();

      const midX = (pointA.screenX + pointB.screenX) / 2;
      const midY = (pointA.screenY + pointB.screenY) / 2;
      ctx.fillStyle = "#1e40af";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${(segment.length / 12).toFixed(1)}'`, midX, midY - 5);
    });

    openings.forEach((opening) => {
      const segment = activeSegments.find((s) => s.id === opening.segmentId);
      if (!segment) return;

      const pointA = activePoints.find((p) => p.id === segment.a);
      const pointB = activePoints.find((p) => p.id === segment.b);
      if (!pointA || !pointB) return;

      const offsetRatio = (opening.offsetFromA || 0) / segment.length;
      const widthRatio = opening.width / segment.length;

      const startX =
        pointA.screenX + (pointB.screenX - pointA.screenX) * offsetRatio;
      const startY =
        pointA.screenY + (pointB.screenY - pointA.screenY) * offsetRatio;
      const endX = startX + (pointB.screenX - pointA.screenX) * widthRatio;
      const endY = startY + (pointB.screenY - pointA.screenY) * widthRatio;

      ctx.strokeStyle = opening.type === "door" ? "#f59e0b" : "#10b981";
      ctx.lineWidth = 6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    activePoints.forEach((point) => {
      ctx.fillStyle = point.id === selectedPoint ? "#ef4444" : "#1e40af";
      ctx.beginPath();
      ctx.arc(point.screenX, point.screenY, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#111827";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(point.id, point.screenX, point.screenY - 10);
    });

    if (activePoints.length >= 3) {
      const area = calculateArea();
      ctx.fillStyle = "#111827";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Area: ${area.toFixed(1)} sq ft`, canvas.width / 2, 30);
    }
  }, [activePoints, activeSegments, calculateArea, openings, selectedPoint]);

  // Render canvas
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  function calculatePerimeter(): number {
    return activeSegments.reduce((total, seg) => total + seg.length, 0) / 12; // Convert to feet
  }

  function calculateBaseboard(): number {
    // Baseboard = perimeter - opening widths
    const totalPerimeter = calculatePerimeter() * 12; // inches
    const openingWidths = openings.reduce((total, op) => total + op.width, 0);
    return (totalPerimeter - openingWidths) / 12; // feet
  }

  async function saveGeometry() {
    const area = calculateArea();
    const perimeter = calculatePerimeter();
    const baseboard = calculateBaseboard();

    try {
      const geometryData: Omit<MeasureGeometry, "id"> = {
        workspaceId,
        jobId,
        roomId,
        version: 1,
        status: "draft",
        units: {
          canonical: "in",
          display: "ft_in",
        },
        origin: {
          x: 0,
          y: 0,
        },
        // Remove screen coordinates before saving canonical geometry
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        points: activePoints.map(({ screenX, screenY, ...p }) => p),
        segments: activeSegments,
        openings,
        areas: [
          {
            id: "main",
            name: "Main Area",
            polygonPointIds: activePoints.map((p) => p.id),
            type: "main",
          },
        ],
        labels: [],
        calculations: {
          area: area * 144, // Store in sq inches (canonical)
          perimeter: perimeter * 12, // Store in inches
          baseboardLf: baseboard, // Store in feet
        },
        confidence: {
          score: readings.length > 0 ? 95 : 70, // Higher if laser-measured
          breakdown: {
            laserCoveragePct:
              activeSegments.length === 0
                ? 0
                : (readings.length / activeSegments.length) * 100,
            manualEditsCount: 0,
            closureError: 0,
          },
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
      };

      if (!geometryId) {
        // Create new geometry
        const geometriesRef = collection(db, MEASURE_COLLECTIONS.GEOMETRIES);
        const docRef = await addDoc(geometriesRef, geometryData);
        setGeometryId(docRef.id);

        onGeometryUpdated?.({
          id: docRef.id,
          ...geometryData,
        });
      } else {
        // Update existing geometry
        const geometryRef = doc(db, MEASURE_COLLECTIONS.GEOMETRIES, geometryId);
        await updateDoc(geometryRef, {
          ...geometryData,
          version: (geometryData.version || 1) + 1,
        });

        onGeometryUpdated?.({
          id: geometryId,
          ...geometryData,
        });
      }
    } catch (err) {
      console.error("Error saving geometry:", err);
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!manualMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add new point
    const newPoint: CanvasPoint = {
      id: `p${manualPoints.length + 1}`,
      x,
      y,
      locked: false,
      screenX: x,
      screenY: y,
    };

    const newPoints = [...manualPoints, newPoint];
    setManualPoints(newPoints);
    setSelectedPoint(newPoint.id);

    // Add segment to previous point
    if (manualPoints.length > 0) {
      const prevPoint = manualPoints[manualPoints.length - 1];
      const distance = Math.sqrt(
        Math.pow(x - prevPoint.x, 2) + Math.pow(y - prevPoint.y, 2),
      );

      const newSegment: GeometrySegment = {
        id: `s${manualSegments.length + 1}`,
        a: prevPoint.id,
        b: newPoint.id,
        length: distance,
        source: "manual",
        readingId: undefined,
      };

      setManualSegments([...manualSegments, newSegment]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Floor Plan</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setManualMode(!manualMode)}
            className={`px-3 py-1 text-sm rounded font-medium ${
              manualMode
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {manualMode ? "Manual Mode" : "Auto Mode"}
          </button>
          <button
            onClick={saveGeometry}
            disabled={activePoints.length < 3}
            className="px-4 py-1 bg-green-600 text-white text-sm rounded font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Save Geometry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Canvas - 2 columns */}
        <div className="col-span-2 border border-gray-300 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="bg-white text-slate-900 cursor-crosshair"
          />
        </div>

        {/* Right Sidebar - 1 column */}
        <div className="col-span-1 space-y-4">
          <OpeningEditor
            segments={activeSegments}
            openings={openings}
            onOpeningsChange={setOpenings}
          />

          <PhotoCapture
            workspaceId={workspaceId}
            jobId={jobId}
            roomId={roomId}
            segments={activeSegments}
            userId={userId}
          />
        </div>
      </div>

      {activePoints.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-muted">Area</p>
            <p className="text-xl font-semibold">
              {calculateArea().toFixed(1)} sq ft
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Perimeter</p>
            <p className="text-xl font-semibold">
              {calculatePerimeter().toFixed(1)} ft
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Baseboard</p>
            <p className="text-xl font-semibold">
              {calculateBaseboard().toFixed(1)} LF
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
