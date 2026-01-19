/**
 * PDF Export Component
 * 
 * Generate floor plan diagrams with measurements as PDF
 */

"use client";

import React, { useState } from "react";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MEASURE_COLLECTIONS } from "@/types/measureSchema";
import type { MeasureGeometry, MeasureExport } from "@/types/measureSchema";

interface PDFExportProps {
  workspaceId: string;
  jobId: string;
  roomId: string;
  geometry: (MeasureGeometry & { id: string }) | null;
  userId: string;
}

export function PDFExport({
  workspaceId,
  jobId,
  roomId,
  geometry,
  userId,
}: PDFExportProps) {
  const [generating, setGenerating] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const db = getFirestore();
  const storage = getStorage();

  async function generatePDF() {
    if (!geometry) {
      alert("No geometry data available. Please save the floor plan first.");
      return;
    }

    setGenerating(true);

    try {
      // Create canvas for PDF generation
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = "#000000";
      ctx.font = "bold 24px Arial";
      ctx.fillText("Floor Plan Measurement", 40, 40);

      // Scale info
      ctx.font = "14px Arial";
      ctx.fillText(`Room ID: ${roomId}`, 40, 70);
      ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 40, 90);

      // Draw grid
      const offsetX = 100;
      const offsetY = 150;
      const scale = 0.5; // Scale down for PDF
      const gridSize = 30; // pixels per foot

      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < 1000; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x, offsetY);
        ctx.lineTo(offsetX + x, offsetY + 700);
        ctx.stroke();
      }
      for (let y = 0; y < 700; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y);
        ctx.lineTo(offsetX + 1000, offsetY + y);
        ctx.stroke();
      }

      // Find bounds for centering
      const points = geometry.points;
      const minX = Math.min(...points.map(p => p.x));
      const maxX = Math.max(...points.map(p => p.x));
      const minY = Math.min(...points.map(p => p.y));
      const maxY = Math.max(...points.map(p => p.y));
      const centerOffsetX = (1000 - (maxX - minX) * scale) / 2;
      const centerOffsetY = (700 - (maxY - minY) * scale) / 2;

      // Draw segments
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      geometry.segments.forEach((segment) => {
        const pointA = points.find(p => p.id === segment.a);
        const pointB = points.find(p => p.id === segment.b);
        if (!pointA || !pointB) return;

        const x1 = offsetX + centerOffsetX + (pointA.x - minX) * scale;
        const y1 = offsetY + centerOffsetY + (pointA.y - minY) * scale;
        const x2 = offsetX + centerOffsetX + (pointB.x - minX) * scale;
        const y2 = offsetY + centerOffsetY + (pointB.y - minY) * scale;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw length label
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = "#1e40af";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${(segment.length / 12).toFixed(1)}'`, midX, midY - 5);
      });

      // Draw openings
      geometry.openings.forEach((opening) => {
        const segment = geometry.segments.find(s => s.id === opening.segmentId);
        if (!segment) return;

        const pointA = points.find(p => p.id === segment.a);
        const pointB = points.find(p => p.id === segment.b);
        if (!pointA || !pointB) return;

        const offsetRatio = (opening.offsetFromA || 0) / segment.length;
        const widthRatio = opening.width / segment.length;

        const x1 = offsetX + centerOffsetX + (pointA.x - minX) * scale;
        const y1 = offsetY + centerOffsetY + (pointA.y - minY) * scale;
        const x2 = offsetX + centerOffsetX + (pointB.x - minX) * scale;
        const y2 = offsetY + centerOffsetY + (pointB.y - minY) * scale;

        const startX = x1 + (x2 - x1) * offsetRatio;
        const startY = y1 + (y2 - y1) * offsetRatio;
        const endX = startX + (x2 - x1) * widthRatio;
        const endY = startY + (y2 - y1) * widthRatio;

        ctx.strokeStyle = opening.type === "door" ? "#f59e0b" : "#10b981";
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw points
      points.forEach((point) => {
        const x = offsetX + centerOffsetX + (point.x - minX) * scale;
        const y = offsetY + centerOffsetY + (point.y - minY) * scale;

        ctx.fillStyle = "#1e40af";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Legend
      const legendY = offsetY + 720;
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = "#000000";
      ctx.fillText("Measurements:", 40, legendY);

      ctx.font = "12px Arial";
      ctx.fillText(`Area: ${(geometry.calculations.area / 144).toFixed(1)} sq ft`, 40, legendY + 25);
      ctx.fillText(`Perimeter: ${(geometry.calculations.perimeter / 12).toFixed(1)} ft`, 40, legendY + 45);
      ctx.fillText(`Baseboard: ${(geometry.calculations.baseboardLf || 0).toFixed(1)} LF`, 40, legendY + 65);
      ctx.fillText(`Confidence: ${geometry.confidence.score}%`, 40, legendY + 85);

      ctx.fillText(`Doors: ${geometry.openings.filter(o => o.type === "door").length}`, 250, legendY + 25);
      ctx.fillText(`Windows: ${geometry.openings.filter(o => o.type === "window").length}`, 250, legendY + 45);
      ctx.fillText(`Points: ${points.length}`, 250, legendY + 65);
      ctx.fillText(`Walls: ${geometry.segments.length}`, 250, legendY + 85);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const filename = `exports/${workspaceId}/${jobId}/${roomId}/${timestamp}.png`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      // Save export metadata
      const exportsRef = collection(db, MEASURE_COLLECTIONS.EXPORTS);
      await addDoc(exportsRef, {
        workspaceId,
        jobId,
        roomId,
        type: "image_png",
        source: {
          geometryId: geometry.id,
        },
        file: {
          storagePath: filename,
          fileName: `floor-plan-${roomId}-${timestamp}.png`,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
      } as Omit<MeasureExport, "id">);

      setLastExport(url);

      // Auto-download
      const link = document.createElement("a");
      link.href = url;
      link.download = `floor-plan-${roomId}-${timestamp}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={generatePDF}
        disabled={!geometry || generating}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <span className="animate-spin">⏳</span>
            Generating...
          </>
        ) : (
          <>
            📄 Export Floor Plan (PNG)
          </>
        )}
      </button>

      {lastExport && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-900 mb-2">✓ Export Complete</p>
          <a
            href={lastExport}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:underline"
          >
            View exported file →
          </a>
        </div>
      )}

      {!geometry && (
        <p className="text-xs text-gray-500 text-center">
          Save geometry first to enable export
        </p>
      )}
    </div>
  );
}
