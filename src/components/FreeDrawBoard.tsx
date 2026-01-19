"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LeicaDistoDevice } from "@/lib/leicaBLE";

/** Tools that resemble MeasureSquare */
type Tool =
  | "laser"
  | "keyboard"
  | "door"
  | "opening"
  | "autoTurn"
  | "hidden"
  | "switch"
  | "triangulation"
  | "snap"
  | "arc"
  | "lock"
  | "slope"
  | "scan";

type Point = { x: number; y: number };
type Stroke = { id: string; points: Point[]; width: number; color: string; distance?: number };
type Shape = { id: string; type: "door" | "opening" | "arc"; x: number; y: number; width: number; height: number; rotation: number };

const TOOL_LIST: { id: Tool; label: string; icon: string }[] = [
  { id: "laser", label: "Laser", icon: "🎯" },
  { id: "keyboard", label: "Keyboard", icon: "⌨️" },
  { id: "door", label: "Door", icon: "🚪" },
  { id: "opening", label: "Opening", icon: "▦" },
  { id: "autoTurn", label: "Auto Turn", icon: "↩︎" },
  { id: "hidden", label: "Hidden", icon: "👁️" },
  { id: "switch", label: "Switch", icon: "⇄" },
  { id: "triangulation", label: "Triangulation", icon: "△" },
  { id: "snap", label: "Snap", icon: "⤧" },
  { id: "arc", label: "Arc", icon: "⌒" },
  { id: "lock", label: "Lock", icon: "🔒" },
  { id: "slope", label: "Slope", icon: "⟍" },
  { id: "scan", label: "Scan", icon: "▣" },
];

export default function FreeDrawBoard() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const leicaDeviceRef = useRef<LeicaDistoDevice | null>(null);

  const [tool, setTool] = useState<Tool>("laser");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeStrokeId, setActiveStrokeId] = useState<string | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [waitingForLaser, setWaitingForLaser] = useState(false);
  const [laserConnected, setLaserConnected] = useState(false);
  const [laserError, setLaserError] = useState<string | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<{ strokes: Stroke[]; shapes: Shape[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // View transform (pan/zoom)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Grid/snap settings
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;

  const pen = useMemo(() => ({ width: 2, color: "#111827" }), []);

  // Save to history
  const saveHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ strokes: [...strokes], shapes: [...shapes] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setStrokes(prev.strokes);
      setShapes(prev.shapes);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setStrokes(next.strokes);
      setShapes(next.shapes);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Snap point to grid
  const snapPoint = (p: Point): Point => {
    if (!snapToGrid) return p;
    return {
      x: Math.round(p.x / gridSize) * gridSize,
      y: Math.round(p.y / gridSize) * gridSize,
    };
  };

  // Calculate distance between two points in pixels, convert to feet
  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixels = Math.sqrt(dx * dx + dy * dy);
    // Assume 20 pixels = 1 foot for display (adjust scale as needed)
    return pixels / 20;
  };

  // Connect to Leica laser device
  const connectLaser = async () => {
    try {
      setLaserError(null);
      const device = new LeicaDistoDevice();
      await device.connect();
      await device.setUnit("ft"); // Set to feet
      leicaDeviceRef.current = device;
      setLaserConnected(true);
      
      // Start continuous listening for measurements
      await device.startContinuous((reading: { distance: number; unit: string; timestamp: number }) => {
        if (waitingForLaser && activeStrokeId) {
          // Laser measurement received, update the active stroke
          setStrokes((prev) =>
            prev.map((s) =>
              s.id === activeStrokeId ? { ...s, distance: reading.distance } : s
            )
          );
          setWaitingForLaser(false);
          setIsDrawing(false);
          setActiveStrokeId(null);
          saveHistory();
        }
      });
    } catch (error: any) {
      const errorMsg = error.message || "Failed to connect to laser device";
      setLaserError(errorMsg);
      setLaserConnected(false);
      
      // Show helpful message for pairing issues
      if (errorMsg.includes("pairing") || errorMsg.includes("GATT")) {
        console.log("TIP: If you see 'GATT operation not permitted', pair the device in Windows Bluetooth settings first");
      }
    }
  };

  // Disconnect laser
  const disconnectLaser = async () => {
    if (leicaDeviceRef.current) {
      await leicaDeviceRef.current.stopContinuous();
      await leicaDeviceRef.current.disconnect();
      leicaDeviceRef.current = null;
      setLaserConnected(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leicaDeviceRef.current) {
        leicaDeviceRef.current.stopContinuous();
        leicaDeviceRef.current.disconnect();
      }
    };
  }, []);

  // Resize canvas to match wrapper
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrap = wrapperRef.current;
      if (!canvas || !wrap) return;

      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
      redraw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, offset, strokes, shapes, showGrid]);

  // Redraw when data changes
  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, shapes, scale, offset, showGrid, selectedShapeId]);

  function screenToWorld(p: Point): Point {
    return {
      x: (p.x - offset.x) / scale,
      y: (p.y - offset.y) / scale,
    };
  }

  function worldToScreen(p: Point): Point {
    return {
      x: p.x * scale + offset.x,
      y: p.y * scale + offset.y,
    };
  }

  function getPointer(e: React.PointerEvent): Point {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White drafting board background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 0.5 / scale;
      
      const worldBounds = {
        left: screenToWorld({ x: 0, y: 0 }).x,
        right: screenToWorld({ x: canvas.width, y: 0 }).x,
        top: screenToWorld({ x: 0, y: 0 }).y,
        bottom: screenToWorld({ x: 0, y: canvas.height }).y,
      };

      // Vertical grid lines
      for (let x = Math.floor(worldBounds.left / gridSize) * gridSize; x <= worldBounds.right; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, worldBounds.top);
        ctx.lineTo(x, worldBounds.bottom);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = Math.floor(worldBounds.top / gridSize) * gridSize; y <= worldBounds.bottom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(worldBounds.left, y);
        ctx.lineTo(worldBounds.right, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Apply transform for drawing world coordinates
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw all strokes
    for (const s of strokes) {
      if (s.points.length < 2) continue;
      ctx.beginPath();
      ctx.lineWidth = s.width;
      ctx.strokeStyle = s.color;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();

      // Draw measurement label if distance is set
      if (s.distance !== undefined && s.points.length >= 2) {
        const start = s.points[0];
        const end = s.points[s.points.length - 1];
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        ctx.save();
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 1;
        const label = `${s.distance.toFixed(2)} ft`;
        const metrics = ctx.measureText(label);
        const padding = 4;
        
        // Draw background
        ctx.fillRect(
          midX - metrics.width / 2 - padding,
          midY - 10,
          metrics.width + padding * 2,
          18
        );
        ctx.strokeRect(
          midX - metrics.width / 2 - padding,
          midY - 10,
          metrics.width + padding * 2,
          18
        );

        // Draw text
        ctx.fillStyle = "#111827";
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, midX, midY);
        ctx.restore();
      }
    }

    // Draw shapes (doors, openings, arcs)
    for (const shape of shapes) {
      const isSelected = shape.id === selectedShapeId;
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);

      if (shape.type === "door") {
        // Draw door (rectangle with arc swing)
        ctx.strokeStyle = isSelected ? "#3b82f6" : "#f59e0b";
        ctx.fillStyle = isSelected ? "rgba(59,130,246,0.1)" : "rgba(245,158,11,0.1)";
        ctx.lineWidth = 2;
        ctx.fillRect(0, 0, shape.width, shape.height);
        ctx.strokeRect(0, 0, shape.width, shape.height);
        
        // Door swing arc
        ctx.beginPath();
        ctx.arc(0, 0, shape.width, 0, Math.PI / 2);
        ctx.stroke();
      } else if (shape.type === "opening") {
        // Draw opening (dashed rectangle)
        ctx.strokeStyle = isSelected ? "#3b82f6" : "#10b981";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(0, 0, shape.width, shape.height);
        ctx.setLineDash([]);
      } else if (shape.type === "arc") {
        // Draw arc
        ctx.strokeStyle = isSelected ? "#3b82f6" : "#8b5cf6";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(shape.width / 2, shape.height / 2, shape.width / 2, 0, Math.PI);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();

    // Subtle edge border
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  }

  function canDraw() {
    return tool === "laser";
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pointer = getPointer(e);

    // Middle mouse or right-click for panning
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setPanStart(pointer);
      return;
    }

    // Check if clicking on a shape for selection
    const worldPos = screenToWorld(pointer);
    for (const shape of [...shapes].reverse()) {
      if (
        worldPos.x >= shape.x &&
        worldPos.x <= shape.x + shape.width &&
        worldPos.y >= shape.y &&
        worldPos.y <= shape.y + shape.height
      ) {
        setSelectedShapeId(shape.id);
        return;
      }
    }
    setSelectedShapeId(null);

    // Handle tool-specific actions
    if (tool === "door" || tool === "opening") {
      const snapped = snapPoint(worldPos);
      const newShape: Shape = {
        id: crypto.randomUUID(),
        type: tool,
        x: snapped.x,
        y: snapped.y,
        width: 60,
        height: 20,
        rotation: 0,
      };
      setShapes((prev) => [...prev, newShape]);
      saveHistory();
      return;
    }

    if (tool === "arc") {
      const snapped = snapPoint(worldPos);
      const newShape: Shape = {
        id: crypto.randomUUID(),
        type: "arc",
        x: snapped.x,
        y: snapped.y,
        width: 80,
        height: 80,
        rotation: 0,
      };
      setShapes((prev) => [...prev, newShape]);
      saveHistory();
      return;
    }

    if (!canDraw()) return;

    setIsDrawing(true);
    const snapped = snapPoint(worldPos);
    const id = crypto.randomUUID();

    setActiveStrokeId(id);
    setStrokes((prev) => [
      ...prev,
      { id, points: [snapped], width: pen.width, color: pen.color },
    ]);
  }

  function onPointerMove(e: React.PointerEvent) {
    const pointer = getPointer(e);

    if (isPanning) {
      const dx = pointer.x - panStart.x;
      const dy = pointer.y - panStart.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart(pointer);
      return;
    }

    if (!isDrawing || !activeStrokeId) return;

    const worldPos = screenToWorld(pointer);
    const snapped = snapPoint(worldPos);
    setStrokes((prev) =>
      prev.map((s) =>
        s.id === activeStrokeId ? { ...s, points: [...s.points, snapped] } : s
      )
    );
  }

  function onPointerUp(e: React.PointerEvent) {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && tool === "laser") {
      // Finger drawing complete, now wait for laser measurement
      if (laserConnected && activeStrokeId) {
        setWaitingForLaser(true);
        // Don't end drawing yet, wait for laser reading
        // Laser callback will finish the stroke
      } else {
        // No laser connected, calculate distance from drawn line
        const stroke = strokes.find((s) => s.id === activeStrokeId);
        if (stroke && stroke.points.length >= 2) {
          const distance = calculateDistance(
            stroke.points[0],
            stroke.points[stroke.points.length - 1]
          );
          setStrokes((prev) =>
            prev.map((s) =>
              s.id === activeStrokeId ? { ...s, distance } : s
            )
          );
        }
        saveHistory();
        setIsDrawing(false);
        setActiveStrokeId(null);
      }
      return;
    }

    if (isDrawing) {
      saveHistory();
    }

    setIsDrawing(false);
    setActiveStrokeId(null);
  }

  function zoom(delta: number) {
    setScale((s) => {
      const next = Math.min(3, Math.max(0.35, s + delta));
      return Math.round(next * 100) / 100;
    });
  }

  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function clearAll() {
    saveHistory();
    setStrokes([]);
    setShapes([]);
  }

  function deleteSelected() {
    if (selectedShapeId) {
      saveHistory();
      setShapes((prev) => prev.filter((s) => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  }

  // Save and return
  const handleDone = () => {
    // TODO: Wire this to save measurements to Firestore
    // For now, just navigate back
    router.push("/app/home");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          undo();
        } else if (e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShapeId, historyIndex]);

  return (
    <div style={styles.shell}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topLeftHint}>
          <button style={styles.iconBtn} onClick={undo} disabled={historyIndex <= 0}>
            ↶ Undo
          </button>
          <button style={styles.iconBtn} onClick={redo} disabled={historyIndex >= history.length - 1}>
            ↷ Redo
          </button>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Grid
          </label>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
            />
            Snap
          </label>
          {!laserConnected ? (
            <button style={styles.laserBtn} onClick={connectLaser}>
              🎯 Connect Laser
            </button>
          ) : (
            <button style={styles.laserBtnConnected} onClick={disconnectLaser}>
              ✓ Laser Connected
            </button>
          )}
          {waitingForLaser && (
            <span style={styles.waitingText}>⏳ Waiting for laser measurement...</span>
          )}
          {laserError && (
            <span style={styles.errorText}>{laserError}</span>
          )}
        </div>
        <button style={styles.doneBtn} onClick={handleDone}>
          Done
        </button>
      </div>

      {/* Body: left tool rail + board */}
      <div style={styles.body}>
        <aside style={styles.toolRail}>
          {TOOL_LIST.map((t) => {
            const active = t.id === tool;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                style={{
                  ...styles.toolBtn,
                  ...(active ? styles.toolBtnActive : {}),
                }}
                title={t.label}
              >
                <div style={styles.toolIcon}>{t.icon}</div>
                <div style={styles.toolLabel}>{t.label}</div>
              </button>
            );
          })}

          <div style={styles.toolRailSpacer} />

          {/* Bottom controls */}
          <div style={styles.bottomTools}>
            <button style={styles.smallBtn} onClick={() => zoom(+0.1)}>
              Zoom +
            </button>
            <button style={styles.smallBtn} onClick={() => zoom(-0.1)}>
              Zoom -
            </button>
            <button style={styles.smallBtn} onClick={resetView}>
              Reset
            </button>
            <button style={styles.smallBtn} onClick={deleteSelected} disabled={!selectedShapeId}>
              Delete
            </button>
            <button style={styles.smallBtnDanger} onClick={clearAll}>
              Clear All
            </button>
          </div>
        </aside>

        <main style={styles.boardWrap} ref={wrapperRef}>
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
          />
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    margin: 0,
    background: "#fafafa",
    fontFamily: "system-ui, sans-serif",
  },
  topBar: {
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
  },
  topLeftHint: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    fontSize: 14,
  },
  iconBtn: {
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 13,
    cursor: "pointer",
    color: "#374151",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#374151",
    cursor: "pointer",
  },
  laserBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  },
  laserBtnConnected: {
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  },
  waitingText: {
    fontSize: 13,
    color: "#f59e0b",
    fontWeight: 600,
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
  },
  doneBtn: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  toolRail: {
    width: 90,
    background: "#f9fafb",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 0",
    gap: 6,
    overflowY: "auto",
  },
  toolBtn: {
    width: 70,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "10px 4px",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  toolBtnActive: {
    background: "#fff",
    border: "1px solid #d1d5db",
  },
  toolIcon: {
    fontSize: 20,
  },
  toolLabel: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  toolRailSpacer: {
    flex: 1,
  },
  bottomTools: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    width: "100%",
    padding: "0 10px",
  },
  smallBtn: {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 11,
    cursor: "pointer",
    color: "#374151",
  },
  smallBtnDanger: {
    background: "#fee",
    border: "1px solid #fca5a5",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 11,
    cursor: "pointer",
    color: "#dc2626",
  },
  boardWrap: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  canvas: {
    display: "block",
    cursor: "crosshair",
    touchAction: "none",
  },
};
