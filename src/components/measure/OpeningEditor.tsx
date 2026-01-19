/**
 * Opening Editor Component
 * 
 * UI for adding doors and windows to wall segments
 */

"use client";

import React, { useState } from "react";
import type { GeometrySegment, GeometryOpening } from "@/types/measureSchema";

interface OpeningEditorProps {
  segments: GeometrySegment[];
  openings: GeometryOpening[];
  onOpeningsChange: (openings: GeometryOpening[]) => void;
}

type OpeningType = "door" | "window";

export function OpeningEditor({
  segments,
  openings,
  onOpeningsChange,
}: OpeningEditorProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [openingType, setOpeningType] = useState<OpeningType>("door");
  const [width, setWidth] = useState<number>(36); // inches
  const [offset, setOffset] = useState<number>(0); // inches from point A
  const [showForm, setShowForm] = useState(false);

  function addOpening() {
    if (!selectedSegment) return;

    const segment = segments.find(s => s.id === selectedSegment);
    if (!segment) return;

    // Validate offset and width
    if (offset < 0 || offset + width > segment.length) {
      alert("Opening dimensions exceed wall length. Please adjust.");
      return;
    }

    // Check for overlaps with existing openings on this segment
    const segmentOpenings = openings.filter(o => o.segmentId === selectedSegment);
    const hasOverlap = segmentOpenings.some(existing => {
      const existingOffset = existing.offsetFromA || 0;
      const existingEnd = existingOffset + existing.width;
      const newEnd = offset + width;
      
      return (
        (offset >= existingOffset && offset < existingEnd) ||
        (newEnd > existingOffset && newEnd <= existingEnd) ||
        (offset <= existingOffset && newEnd >= existingEnd)
      );
    });

    if (hasOverlap) {
      alert("Opening overlaps with existing opening. Please adjust position.");
      return;
    }

    const newOpening: GeometryOpening = {
      id: `op${openings.length + 1}`,
      segmentId: selectedSegment,
      type: openingType,
      width,
      offsetFromA: offset,
    };

    onOpeningsChange([...openings, newOpening]);
    
    // Reset form
    setWidth(36);
    setOffset(0);
    setShowForm(false);
  }

  function removeOpening(openingId: string) {
    onOpeningsChange(openings.filter(o => o.id !== openingId));
  }

  function getSegmentOpenings(segmentId: string): GeometryOpening[] {
    return openings.filter(o => o.segmentId === segmentId);
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700">Doors & Windows</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add Opening"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wall Segment
            </label>
            <select
              value={selectedSegment || ""}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a wall...</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.id} ({(segment.length / 12).toFixed(1)}&apos; long)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOpeningType("door")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  openingType === "door"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                🚪 Door
              </button>
              <button
                onClick={() => setOpeningType("window")}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  openingType === "window"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                🪟 Window
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (inches)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(width / 12).toFixed(2)} feet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offset (inches)
              </label>
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                From wall start
              </p>
            </div>
          </div>

          {selectedSegment && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>Wall length:</strong>{" "}
              {((segments.find(s => s.id === selectedSegment)?.length || 0) / 12).toFixed(1)}&apos;
              <span className="ml-2">
                <strong>Available space:</strong>{" "}
                {((segments.find(s => s.id === selectedSegment)?.length || 0) - offset - width) / 12 < 0 
                  ? "❌ Exceeds wall" 
                  : `✓ ${(((segments.find(s => s.id === selectedSegment)?.length || 0) - offset - width) / 12).toFixed(1)}' remaining`}
              </span>
            </div>
          )}

          <button
            onClick={addOpening}
            disabled={!selectedSegment}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Add {openingType === "door" ? "Door" : "Window"}
          </button>
        </div>
      )}

      {/* Openings List */}
      {openings.length > 0 ? (
        <div className="space-y-2">
          {segments.map((segment) => {
            const segmentOpenings = getSegmentOpenings(segment.id);
            if (segmentOpenings.length === 0) return null;

            return (
              <div key={segment.id} className="border-l-4 border-blue-400 pl-3">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  {segment.id} ({(segment.length / 12).toFixed(1)}&apos;)
                </p>
                {segmentOpenings.map((opening) => (
                  <div
                    key={opening.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      opening.type === "door"
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {opening.type === "door" ? "🚪" : "🪟"}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {opening.type === "door" ? "Door" : "Window"}
                        </p>
                        <p className="text-xs text-gray-600">
                          {(opening.width / 12).toFixed(1)}&apos; wide ·
                          {((opening.offsetFromA || 0) / 12).toFixed(1)}&apos; offset
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeOpening(opening.id)}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          No doors or windows added yet.
        </div>
      )}

      {openings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Doors</p>
              <p className="text-lg font-semibold text-amber-700">
                {openings.filter(o => o.type === "door").length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Windows</p>
              <p className="text-lg font-semibold text-green-700">
                {openings.filter(o => o.type === "window").length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
