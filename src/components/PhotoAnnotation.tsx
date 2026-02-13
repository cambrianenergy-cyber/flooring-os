"use client";
import React, { useRef, useState } from "react";

interface PhotoAnnotationProps {
  imageUrl: string;
  onSave?: (dataUrl: string) => void;
}

export default function PhotoAnnotation({
  imageUrl,
  onSave,
}: PhotoAnnotationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#ff0000");
  const [lineWidth, setLineWidth] = useState(3);

  const handleMouseDown = () => setDrawing(true);
  const handleMouseUp = () => setDrawing(false);
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    if (onSave) onSave(dataUrl);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { type: "success", message: "Annotated photo saved!" },
      }),
    );
  };

  // Draw image on canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.beginPath();
    };
  }, [imageUrl]);

  return (
    <div className="max-w-lg mx-auto p-4 border rounded bg-background text-slate-900">
      <h2 className="text-lg font-semibold mb-2">Photo Annotation</h2>
      <div className="flex gap-2 mb-2">
        <label>
          Color:{" "}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <label>
          Line Width:{" "}
          <input
            type="number"
            min={1}
            max={10}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </label>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Save
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={350}
        style={{ border: "1px solid #ccc", cursor: "crosshair" }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseUp}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}
